import React from "react";
import { connect } from "react-redux";
import { Row, Col, ProgressBar, Table, Button } from 'react-bootstrap';
import { DOWNLOAD_STATUS } from '../constants';
import { restartApp, retryFailedImages } from '../redux/actions';

const { PENDING, ERROR } = DOWNLOAD_STATUS;

class ImageElem extends React.Component {
    render = () => {
        const { name, status } = this.props.image;
        return (
            <tr>
                <td>{name}</td>
                <td>{status}</td>
            </tr >
        );
    }
}

class DownloadList extends React.Component {
    downloadingHeader = () => {
        const { images, imagesIds } = this.props;

        const current = imagesIds.filter(name => images[name].status !== PENDING).length;
        const total = imagesIds.length;

        return (
            <Row>
                <Col xs="auto">
                    <p>Downloading...</p>
                </Col>
                <Col>
                    <ProgressBar animated now={current * 100 / total} />
                </Col>
            </Row>
        );
    };

    handleRestart = (e) => {
        e.preventDefault();
        this.props.restartApp();
    };

    handleRetry = (e) => {
        e.preventDefault();
        this.props.retryFailedImages();
    };

    finishedHeader = () => {
        const { images, imagesIds } = this.props;

        const hasErrors = imagesIds.filter(name => images[name].status === ERROR).length > 0;

        return (
            <Row>
                <Col>
                    <p>Finished !</p>
                </Col>
                {hasErrors && <Col xs="auto">
                    <Button variant="warning" onClick={this.handleRetry}>Retry Errors</Button>
                </Col>}
                <Col xs="auto">
                    <Button variant="primary" onClick={this.handleRestart}>Restart</Button>
                </Col>
            </Row>
        );
    };

    render = () => {
        const { done, imagesIds, images } = this.props;
        return (
            <Row>
                <Col>

                    {done ? this.finishedHeader() : this.downloadingHeader()}

                    <Row>
                        <Col>
                            <Table striped bordered hover size="sm">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        imagesIds.map((imgName) => {
                                            return <ImageElem key={`todo-${imgName}`} image={images[imgName]} />;
                                        })
                                    }
                                </tbody>
                            </Table>
                        </Col>
                    </Row>

                </Col>
            </Row>
        );
    };
}

const mapStateToProps = state => {
    const { done, imagesIds, images } = state.downloads;
    return { done, imagesIds, images };
};

export default connect(
    mapStateToProps,
    { restartApp, retryFailedImages }
)(DownloadList);
