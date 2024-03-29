export interface AlbumPattern {
    example: string;
    host: string;
    path: RegExp;
    imgSelector: string;
    pageKey: string;
}

export const availableSites: AlbumPattern[] = [
    {
        example: 'https://www.douban.com/photos/album/34084898/',
        host: 'www.douban.com',
        path: /^\/photos\/album\/(\d+)/,
        imgSelector: 'div.photo_wrap img',
        pageKey: 'm_start',
    },
    {
        example: 'https://site.douban.com/108128/widget/photos/1164317/',
        host: 'site.douban.com',
        path: /^\/\d+\/widget\/photos\/(\d+)/,
        imgSelector: 'div.photo-item img',
        pageKey: 'start',
    },
    {
        example: 'https://site.douban.com/108128/widget/public_album/161454/',
        host: 'site.douban.com',
        path: /^\/\d+\/widget\/public_album\/(\d+)/,
        imgSelector: 'div.photo-item img',
        pageKey: 'start',
    },
];

export interface Album {
    imgSelector: string;
    pageKey: string;
    albumUrl: string;
    albumId: string;
}

export function matchSite(uri: URL) {
    for (const site of availableSites) {
        if (uri.host !== site.host) {
            continue;
        }

        const match = site.path.exec(uri.pathname);
        if (match === null) {
            continue;
        }

        const albumId = match[1];
        uri.search = '';

        return {
            imgSelector: site.imgSelector,
            pageKey: site.pageKey,
            albumUrl: uri.toString(),
            albumId,
        } as Album;
    }

    return null;
};