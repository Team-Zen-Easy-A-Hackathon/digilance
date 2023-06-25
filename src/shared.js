
export const formatAddress = address => {
	const prefix = "0x";
	const formattedAddress = address.slice(0, 6) + "..." + address.slice(-4);
	return prefix + formattedAddress;
}

const Status = {
	none: 0,
	requested: 1,
	accepted: 2,
	submitted: 3,
	completed: 4,
	canceled: 5
};

export const getStatusString = (enumValue) =>{
	switch (parseInt(enumValue)) {
		case Status.none:
			return "None";
		case Status.requested:
			return "Requested";
		case Status.accepted:
			return "Accepted";
		case Status.submitted:
			return "Submitted";
		case Status.completed:
			return "Completed";
		case Status.canceled:
			return "Canceled";
		default:
			return "";
	}
}

