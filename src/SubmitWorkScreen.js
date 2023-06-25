import React, { useState, useEffect } from 'react';
import { Button, Form, Columns, Heading } from 'react-bulma-components';

const { Input, Field, Control, Label } = Form;

// import { CONTRACT_ABI, CONTRACT_ADDRESS } from './constants';

const SubmitWorkScreen = ({ routingOptions, submitWork, error }) => {
	const [title, setTitle] = useState('');
	const [url, setURL] = useState('');
	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (routingOptions.title) {
			setTitle(routingOptions.title);
		}

	}, [routingOptions.title])

	const handleTitleChange = (event) => {
		setTitle(event.target.value);
	};


	const handleSubmit = async () => {
		setLoading(true);
		try {
			await submitWork(title, url);
		} catch (error) {
			setLoading(false);
			console.error(error);
		}
	};

	return (
		<Columns className="is-centered">
			<Columns.Column size={4}>
				<Heading className="has-text-centered">Submit Work</Heading>
				<Field>
					<Label>Title</Label>
					<Control>
						<Input value={title} onChange={handleTitleChange} required />
					</Control>
				</Field>
				<Field>
					<Label>URL</Label>
					<Control>
						<Input value={url} onChange={(e) => setURL(e.target.value)} required />
					</Control>
				</Field>
				{ error && <div className="error-text">{error}</div>}
				<div className="has-text-centered">
					<Button
						rounded
						color="primary"
						onClick={handleSubmit}
						className={loading && 'is-loading'}
					>
						Submit Work
					</Button>
				</div>
			</Columns.Column>
		</Columns>
	);
};

export default SubmitWorkScreen;
