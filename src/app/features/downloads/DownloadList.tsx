import * as React from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { Row, Col, ProgressBar, Table, Button } from 'react-bootstrap';
import {
    Image,
    DownloadStatus,
    selectImages,
    selectDone,
    retryFailedImages,
} from './downloadsSlice';

function ImageElem({ image }: {image: Image}) {
    return (
        <tr>
            <td>{image.name}</td>
            <td>{image.status}</td>
        </tr >
    );
}

function DownloadingHeader() {
    const { imagesIds, images } = useAppSelector(selectImages);

    const current = imagesIds.filter(name => images[name].status !== DownloadStatus.Pending).length;
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
}

function FinishedHeader() {
    const { imagesIds, images } = useAppSelector(selectImages);
    const dispatch = useAppDispatch();

    const hasErrors = imagesIds.filter(name => images[name].status === DownloadStatus.Error).length > 0;

    return (
        <Row>
            <Col>
                <p>Finished !</p>
            </Col>
            {hasErrors && <Col xs="auto">
                <Button variant="warning" onClick={() => dispatch(retryFailedImages())}>Retry Errors</Button>
            </Col>}
            <Col xs="auto">
                <Button variant="primary" onClick={() => window.location.reload()}>Restart</Button>
            </Col>
        </Row>
    );
}

export function DownloadList() {
    const { imagesIds, images } = useAppSelector(selectImages);
    const done = useAppSelector(selectDone);
    
    return (
        <Row>
            <Col>

                {done ? <FinishedHeader /> : <DownloadingHeader />}

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
}
