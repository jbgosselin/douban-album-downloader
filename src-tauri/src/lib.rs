use fake_user_agent::get_rua;
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;
use tokio_util::sync::CancellationToken;


struct DownloadState {
    client: Client,
    active_downloads: Mutex<HashMap<String, CancellationToken>>,
}

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("{0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Request(#[from] reqwest::Error),
    #[error("{0}")]
    Tauri(#[from] tauri::Error),
    #[error("{0}")]
    Other(String),
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

type AppResult<T> = Result<T, AppError>;

#[derive(Serialize)]
struct CreateOutputDirectoryResult {
    #[serde(rename = "outputDir")]
    output_dir: Option<String>,
    canceled: bool,
}

#[tauri::command]
async fn create_output_directory(
    window: tauri::Window,
    dir_name: String,
) -> AppResult<CreateOutputDirectoryResult> {
    use tauri_plugin_dialog::DialogExt;

    let folder = window
        .dialog()
        .file()
        .blocking_pick_folder();

    let folder = match folder {
        Some(f) => f,
        None => {
            return Ok(CreateOutputDirectoryResult {
                output_dir: None,
                canceled: true,
            });
        }
    };

    let base_path = folder
        .as_path()
        .ok_or_else(|| AppError::Other("Invalid folder path".into()))?;
    let output_dir = base_path.join(&dir_name);

    match tokio::fs::create_dir(&output_dir).await {
        Ok(_) => {}
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {}
        Err(e) => return Err(AppError::Io(e)),
    }

    let output_dir_str = output_dir
        .to_str()
        .ok_or_else(|| AppError::Other("Invalid path encoding".into()))?
        .to_string();

    Ok(CreateOutputDirectoryResult {
        output_dir: Some(output_dir_str),
        canceled: false,
    })
}

#[tauri::command]
async fn open_output_directory(dir_path: String) -> AppResult<()> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&dir_path)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&dir_path)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&dir_path)
            .spawn()
            .map_err(|e| AppError::Io(e))?;
    }
    Ok(())
}

#[derive(Serialize)]
struct DownloadResult {
    error: Option<String>,
    #[serde(rename = "filePath")]
    file_path: Option<String>,
}

#[tauri::command]
async fn download_single_image(
    state: tauri::State<'_, Arc<DownloadState>>,
    img_url: String,
    output_path: String,
    timeout: u64,
    referer: String,
) -> Result<DownloadResult, ()> {
    let token = CancellationToken::new();
    {
        let mut downloads = state.active_downloads.lock().await;
        downloads.insert(img_url.clone(), token.clone());
    }

    let ua: &str = get_rua();

    let result = tokio::select! {
        _ = token.cancelled() => {
            Ok(DownloadResult { error: Some("cancelled".into()), file_path: None })
        }
        res = async {
            let response = state.client
                .get(&img_url)
                .header("Referer", &referer)
                .header("User-Agent", ua)
                .timeout(std::time::Duration::from_secs(timeout))
                .send()
                .await;

            match response {
                Ok(resp) => {
                    let bytes = resp.bytes().await;
                    match bytes {
                        Ok(data) => {
                            match tokio::fs::write(&output_path, &data).await {
                                Ok(_) => Ok(DownloadResult {
                                    error: None,
                                    file_path: Some(output_path.clone()),
                                }),
                                Err(e) => Ok(DownloadResult {
                                    error: Some(format!("{}", e)),
                                    file_path: None,
                                }),
                            }
                        }
                        Err(e) => Ok(DownloadResult {
                            error: Some(format!("{}", e)),
                            file_path: None,
                        }),
                    }
                }
                Err(e) => Ok(DownloadResult {
                    error: Some(format!("{}", e)),
                    file_path: None,
                }),
            }
        } => res,
    };

    {
        let mut downloads = state.active_downloads.lock().await;
        downloads.remove(&img_url);
    }

    result
}

#[tauri::command]
async fn cancel_all_downloads(state: tauri::State<'_, Arc<DownloadState>>) -> Result<(), ()> {
    let downloads = state.active_downloads.lock().await;
    for token in downloads.values() {
        token.cancel();
    }
    Ok(())
}

#[tauri::command]
fn random_user_agent() -> &'static str {
    get_rua()
}

#[tauri::command]
async fn fetch_page(
    state: tauri::State<'_, Arc<DownloadState>>,
    url: String,
    referer: String,
    timeout: u64,
) -> AppResult<String> {
    let ua: &str = get_rua();

    let response = state
        .client
        .get(&url)
        .header("Referer", &referer)
        .header("User-Agent", ua)
        .timeout(std::time::Duration::from_secs(timeout))
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status().as_u16();
        let reason = response
            .status()
            .canonical_reason()
            .unwrap_or("Unknown");
        return Err(AppError::Other(format!(
            "HTTP {} {} for {}",
            status, reason, url
        )));
    }

    let text = response.text().await?;
    Ok(text)
}

pub fn run() {
    let download_state = Arc::new(DownloadState {
        client: Client::new(),
        active_downloads: Mutex::new(HashMap::new()),
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .manage(download_state)
        .invoke_handler(tauri::generate_handler![
            create_output_directory,
            open_output_directory,
            download_single_image,
            cancel_all_downloads,
            random_user_agent,
            fetch_page,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
