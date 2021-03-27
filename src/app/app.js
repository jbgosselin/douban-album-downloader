import React from 'react';
import { connect } from "react-redux";
import { Container, Row, Col } from 'react-bootstrap';

import URLInput from './components/url-input';
import DownloadList from './components/download-list';

import { STEPS } from './constants';

const Title = () => (
    <Row>
        <Col>
            <h1>Douban Album Downloader</h1>
        </Col>
    </Row>
);

class Application extends React.Component {
    render = () => (
        <Container>
            <Title />
            {this.chooseStepComponent()}
        </Container>
    );


    chooseStepComponent = () => {
        switch (this.props.step) {
            case STEPS.INPUT_URL:
                return <URLInput />;
            case STEPS.DOWNLOADING:
                return <DownloadList />;
            default:
                return null;
        }
    };
}

const mapStateToProps = state => {
    const { step } = state.step;
    return { step };
};
export default connect(mapStateToProps)(Application);
