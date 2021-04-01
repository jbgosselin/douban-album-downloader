import * as React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

import { URLInput } from './features/url-input/URLInput';
import { DownloadList }  from './features/downloads/DownloadList';

const Title = () => (
    <Row>
        <Col>
            <h1>Douban Album Downloader</h1>
        </Col>
    </Row>
);

const Application = () => (
    <Container>
        <Title />
        <URLInput />
        <DownloadList />
    </Container>
);

export default Application;
