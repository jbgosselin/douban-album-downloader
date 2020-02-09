import { Formik } from 'formik';
import React from "react";
import { connect } from "react-redux";
import { Row, Col, Form, Button } from 'react-bootstrap';
import { startDownloadAlbum } from "../redux/actions";

class URLInput extends React.Component {
    handleSubmit = ({ input }) => {
        const site = matchSite(new URL(input));
        this.props.startDownloadAlbum(site);
    };

    handleValidate = ({ input }) => {
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

    render = () => (
        <Row>
            <Col>
                <Formik initialValues={{ input: '' }} onSubmit={this.handleSubmit} validate={this.handleValidate}>
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
                                    <code>https://site.douban.com/108128/widget/photos/1164317/</code>
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

export default connect(
    null,
    { startDownloadAlbum }
)(URLInput);

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
];

const matchSite = (uri) => {
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
