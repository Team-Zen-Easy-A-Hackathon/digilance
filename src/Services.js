import React from 'react';
import { Button, Container, Heading, Content, Form } from 'react-bulma-components';

import Modal from './Modal';
import Table from './Table';
import { formatAddress, getStatusString } from './shared';

const { Label } = Form;

const headers = ['Id', 'Title', 'URL', 'Reward (FLT)', 'Deadline', 'Submitted At', 'Client', 'Freelancer', 'Status', 'Action'];

export default function Services({
	services, approveService, account, loadingButton, error,
	currentServiceIdx, serviceClickedHandler, hideModal
}) {

	const renderHeaders = () => headers.map(header => (
		<th key={header}>
			{header}
		</th>
	));

	const renderBody = () => services.length > 0 ? (
		services.map((d, i) => (
			<tr key={d.id}>
				<td>
					{d.id}
				</td>
				<td
					// style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}
					// onClick={() => articleClickedHandler(i)}
				>
					{d.title}
				</td>
				<td
					style={{ color: 'blue', cursor: 'pointer', fontWeight: 'bold' }}
					// onClick={() => articleClickedHandler(i)}
				>
					{d.url}
				</td>
				<td>
					{d.reward}
				</td>
				<td>
					{new Date(+d.deadline).toDateString()}
				</td>
				<td>
					{new Date(+d.createdAt).toDateString()}
				</td>
				<td>
					{formatAddress(d.client)}
				</td>
				<td>
					{formatAddress(d.freelancer)}
				</td>
				<td>
				{getStatusString(d.status)}
				</td>
				{(d.client === account && d.status !== "4") && (
					<Button
						color="success"
						style={{ marginTop: '5px' }}
						className={loadingButton === i && 'is-loading'}
						onClick={() => approveService(d.title, i)}
					>
						Approve Article
					</Button>
				)}
			</tr>
		))) : null;

	const renderArticle = article => {
		return (
				<Container>
					<Heading size={1} mb={4}>{article.title}</Heading>
					<Label>freelancer: {` ${formatAddress(article.freelancer)}`}</Label>
					<Label>Reward: {` ${article.reward} FLT`}</Label>
					<Label>Published at: {` ${new Date(+article.createdAt).toDateString()}`}</Label>
					<Content className="article-content">
						{article.content}
						</Content>
				</Container>
		);
	};

	return (
		<>
			<Heading className="has-text-centered">Services</Heading>
			{error && <div className="error-text">{error}</div>}
			<Table
				renderHeaders={renderHeaders}
				renderBody={renderBody}
				noData={!services.length}
				noDataText="No services have been completed."
				width="80%"
			/>
			{
				currentServiceIdx !== null ? (
					<Modal
						title={services[currentServiceIdx].title}
						hideModal={hideModal}
						modalBody={() => renderArticle(services[currentServiceIdx])}
						customStyle={{ height: '600px'}}
					/>
				) : null}
		</>
	)
}
