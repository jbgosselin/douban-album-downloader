import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import URLInput from './components/url-input';

class Title extends React.Component {
    render() {
        return (
            <Row>
                <Col>
                    <h1>Douban Album Downloader</h1>
                </Col>
            </Row>
        );
    }
}

export class Application extends React.Component {
    render() {
        return (
            <Container>
                <Title />
                <URLInput />
            </Container>
        );
    }
}
