import React, { useState } from "react";
import { Form, Button, Columns, Heading,  } from "react-bulma-components";

const { Input, Field, Control, Label, Textarea } = Form;

function RequestServiceForm({ requestService, error }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [category, setCategory] = useState("");
	const [deadline, setDeadline] = useState("");
	const [reward, setReward] = useState("");

	const handleSubmit = () => {
		const formattedDate = new Date(deadline).getTime();
		requestService({ title, deadline: formattedDate, reward, description, category });
	};

	const handleDescriptionChange = (event) => {
		setDescription(event.target.value);
	}

	return (
		<Columns className="is-centered">
			<Columns.Column size={4}>
				<Heading className="has-text-centered">Request Article</Heading>
				<Field>
					<Label>Title:</Label>
					<Control>
						<Input
							type="text"
							placeholder="Enter the title of the service"
							value={title}
							onChange={(event) => setTitle(event.target.value)}
						/>
					</Control>
				</Field>
				<Field>
					<Label>Description</Label>
					<Control>
						<Textarea value={description} onChange={handleDescriptionChange} required />
					</Control>
				</Field>
				<Field>
					<Label>Category:</Label>
					<Control>
						<Input
							type="text"
							placeholder="Enter the category of the service"
							value={category}
							onChange={(event) => setCategory(event.target.value)}
						/>
					</Control>
				</Field>
				<Field>
					<Label>Deadline:</Label>
					<Control>
						<Input
							type="datetime-local"
							placeholder="Enter the deadline for the article"
							value={deadline}
							onChange={(event) => setDeadline(event.target.value)}
						/>
					</Control>
				</Field>
				<Field>
					<Label>Reward:</Label>
					<Control>
						<Input
							type="text"
							placeholder="Enter the reward for the article"
							value={reward}
							onChange={(event) => setReward(event.target.value)}
						/>
					</Control>
				</Field>
				{error && <div className="error-text">{error}</div>}
				<div className="has-text-centered">
					<Button rounded color="primary" onClick={handleSubmit}>Request Service</Button>
				</div>
			</Columns.Column>
		</Columns>
	);
}

export default RequestServiceForm;