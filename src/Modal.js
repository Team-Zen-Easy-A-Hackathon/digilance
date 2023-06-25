import React from 'react';
import { Modal, Button } from 'react-bulma-components';

const { Card, Content } = Modal

export default function modal({ title, modalBody, hideModal, customStyle={} }) {
	return (
		<>
			<Modal
				onClose={hideModal}
				show
				style={customStyle}
			>
				<Card>
					<Card.Header>
						<Card.Title align="center" style={{ fontWeight: 'bold'}}>
							{title}
						</Card.Title>
					</Card.Header>
					<Card.Body>
								<Content>
									{modalBody()}
								</Content>
					</Card.Body>
					<Card.Footer
						justifyContent="flex-end"
						// hasAddons
						// renderAs={function noRefCheck() { }}
					>
						{/* <Button color="success">
							Save
						</Button> */}
						<Button onClick={hideModal}>
							Close
						</Button>
					</Card.Footer>
				</Card>
			</Modal>
		</>
	)
}