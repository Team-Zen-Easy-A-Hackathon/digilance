import React from 'react';
import { Box, Table } from 'react-bulma-components';



export default function table({ renderHeaders, renderBody, width = '75%', noData, noDataText }) {
	return (
		<Box style={{ width, margin: '20px auto' }}>
			<Table width="100%">
				<thead>
					<tr>
						{renderHeaders()}
					</tr>
				</thead>
				<tbody>
					{renderBody()}
					{noData && (
						<tr><td colSpan="12" style={{ textAlign: 'center', fontWeight: 'bold', border: 'none'}}>{noDataText}</td></tr>
					)}
				</tbody>
			</Table>
		</Box>
	)
}
