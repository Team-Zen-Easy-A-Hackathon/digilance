import React, { useState } from "react";
import { Form, Button } from "react-bulma-components";

import Modal from "./Modal";

const { Input, Field, Control, Label } = Form;

function BuyFLTScreen({ purchaseFLT, hideModal, ETHBalance, error, loadingButton }) {
	const [etherAmount, setEtherAmount] = useState(0);
	const [FLTAmount, setFLTAmount] = useState(0)

	// const handleSubmit = () => {
	// 	const formattedDate = new Date(deadline).getTime();
	// 	requestArticle({ topic, deadline: formattedDate, reward });
	// };

	return (
		<Modal
			title="Buy FLT"
			hideModal={hideModal}
			modalBody={() => (
				<>
					<Label>ETH Balance: {`${ETHBalance} ETH`}</Label>
					<Field>
						<Label>Ether Amount:</Label>
						<Control>
							<Input
								type="number"
								placeholder="Enter Ether amount"
								value={Number(etherAmount).toString()}
								onChange={({ target: { value } }) => {
									if (value >= 0) {
										setEtherAmount(value);
										setFLTAmount(value * 100)
									}
								}}
							/>
						</Control>
					</Field>
					<Field>
						<Label>FLT Amount: {`${FLTAmount} FLT (1 ETH = 100 FLT)`}</Label>
					</Field>
					{ error && <div className="error-text">{error}</div>}
					<div className="has-text-centered">
						<Button
							color="info"
							onClick={() => purchaseFLT(etherAmount)}
							className={loadingButton && 'is-loading'}
						>
							Purchase FLT
						</Button>
					</div>
				</>
			)}
		/>
	)
}

export default BuyFLTScreen;