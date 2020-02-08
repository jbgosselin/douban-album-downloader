import React from "react";
import { connect } from "react-redux";
import { Row, Col, Form, Button } from 'react-bootstrap';
// import { addTodo } from "../redux/actions";

class URLInput extends React.Component {
    constructor(props) {
        super(props);
        this.state = { input: "" };
    }

    handleChange = (e) => {
        this.setState({ input: e.target.value });
    };

    handleAddTodo = () => {
        // this.props.addTodo(this.state.input);
        this.setState({ input: "" });
    };

    handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Input: ${this.state.input}`);
    };

    render() {
        return (
            <Row>
                <Col>
                    <Form onSubmit={this.handleSubmit}>
                        <Form.Group controlId="inputUrl">
                            <Form.Label>Album URL</Form.Label>
                            <Form.Control type="text" onChange={this.handleChange} value={this.state.input} />
                            <Form.Text className="text-muted">
                                Should be something like <code>https://www.douban.com/photos/album/34084898/</code>
                            </Form.Text>
                        </Form.Group>
                        <Button type="submit" variant="primary">Download</Button>
                    </Form>
                </Col>
            </Row>
        );
    }
}

export default connect(
    null,
    {}// { addTodo }
)(URLInput);
// export default URLInput;
