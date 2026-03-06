{
  description = "A basic flake with a shell";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShells.default = pkgs.mkShell {
        packages = [
          pkgs.bashInteractive
          pkgs.nodejs_24
          pkgs.rustc
          pkgs.cargo
          pkgs.cargo-tauri
          pkgs.pkg-config
          pkgs.openssl
        ] ++ pkgs.lib.optionals pkgs.stdenv.hostPlatform.isLinux [
          pkgs.webkitgtk_4_1
          pkgs.libappindicator-gtk3
          pkgs.librsvg
        ];
      };
    });
}
