import { Formik } from 'formik';
import * as React from 'react';
import { useDispatch } from "react-redux";
import { Row, Col, Form, Button } from 'react-bootstrap';
import { startDownloadAlbum } from '../downloads/downloadsSlice';

export function URLInput() {
    const dispatch = useDispatch();

    const handleSubmit = ({ input }: {input: string}) => {
        const album = matchSite(new URL(input));
        dispatch(startDownloadAlbum(album));
    };

    const handleValidate = ({ input }: {input: string}) => {
        let parsedUrl;
        try {
            parsedUrl = new URL(input);
        } catch {
            return { input: "Not a valid URL" };
        }

        const site = matchSite(parsedUrl);
        if (site === null) {
            return { input: "Not a douban URL" };
        }

        return {};
    };

    return (
        <Row>
            <Col>
                <Formik initialValues={{ input: '' }} onSubmit={({input}) => handleSubmit({input})} validate={({input}) => handleValidate({input})}>
                    {({ handleSubmit, handleChange, handleBlur, values, touched, errors }) => (
                        <Form noValidate onSubmit={handleSubmit}>
                            <Form.Group controlId="inputUrl">
                                <Form.Label>Album URL</Form.Label>
                                <Form.Control type="text" name="input" onChange={handleChange} onBlur={handleBlur}
                                    value={values.input} isInvalid={touched.input && errors.input} />
                                <Form.Control.Feedback type="invalid">{errors.input}</Form.Control.Feedback>
                                <Form.Text className="text-muted">
                                    Should be something like<br />
                                    <code>https://www.douban.com/photos/album/34084898/</code><br />
                                    <code>https://site.douban.com/108128/widget/photos/1164317/</code><br />
                                    <code>https://site.douban.com/108128/widget/public_album/161454/</code>
                                </Form.Text>
                            </Form.Group>
                            <Button type="submit" variant="primary">Download</Button>
                        </Form>
                    )}
                </Formik>
            </Col>
        </Row>
    );
}

const availableSites = [
    {
        host: 'www.douban.com',
        path: /^\/photos\/album\/(\d+)/,
        imgSelector: 'div.photo_wrap img',
        pageKey: 'm_start',
    },
    {
        host: 'site.douban.com',
        path: /^\/\d+\/widget\/photos\/(\d+)/,
        imgSelector: 'div.photo-item img',
        pageKey: 'start',
    },
    {
        host: 'site.douban.com',
        path: /^\/\d+\/widget\/public_album\/(\d+)/,
        imgSelector: 'div.photo-item img',
        pageKey: 'start',
    },
];

const matchSite = (uri: URL) => {
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
        };
    }

    return null;
};
