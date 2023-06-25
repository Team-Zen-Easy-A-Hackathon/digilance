import React from 'react';
import { Heading, Button } from 'react-bulma-components';

import Table from './Table';
import { formatAddress, getStatusString } from './shared';

const headers = ['Id', 'Title', 'Reward', 'Deadline', 'Client', 'Freelancer', 'Status', 'Action'];

export default function ServiceRequests({ serviceRequests, account, acceptServiceRequest, loadingButton, setRoute, error }) {

	const renderHeaders = () => headers.map(header => (
		<th key={header}>
			{header}
		</th>
	));

	const renderBody = () => serviceRequests.length > 0 ?
	serviceRequests.map((d, i) => (
			<tr key={d.id}>
				<td>
					{d.id}
				</td>
				<td>
					{d.title}
				</td>
				<td>
					{d.reward}
				</td>
				<td>
					{new Date(+d.deadline).toDateString()}
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
				<td>
					{d.client !== account && d.status === '1' && d.freelancer !== account && (
						<Button
							color="primary"
							className={loadingButton === i && 'is-loading'}
							onClick={() => acceptServiceRequest(d.title, i)}
						>
							Accept Service
						</Button>
					)}
					{(d.freelancer === account && d.status === '2') && (
						<Button
							color="info"
							onClick={() => setRoute('submit-work', { title: d.title })}
						>
							Submit Work
						</Button>
					)}
				</td>
			</tr>
		))
		: null;

	return (
		<>
			<Heading className="has-text-centered">Service Requests</Heading>
			{error && <div className="error-text">{error}</div>}
			<Table
				renderHeaders={renderHeaders}
				renderBody={renderBody}
				noData={!serviceRequests.length}
				noDataText="No services have been requested."
			/>
		</>
	)
}
