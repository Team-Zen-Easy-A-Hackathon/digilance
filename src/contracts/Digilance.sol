pragma solidity >=0.8.1;
// SPDX-License-Identifier: MIT

import "./FLT.sol";
import "./Ether.sol";
import "./SafeMath.sol";

contract Digilance {
    string public name = "Digilance";
    address public owner;
    FLTToken private fLTToken;
    Ether private etherToken;
    uint16 internal constant TOKEN_PER_ETHER = 100;
	bool private purchasingFLT = false;

    using SafeMath for uint256;

    event WorkAccepted(
        uint id,
        string title,
        string description,
        string category,
        uint reward,
        address payable client,
        address payable freelancer,
        Status status
    );

    event WorkApproved(
        uint id,
        string title,
        address reviewer
    );

    enum Status {
        none,
        requested,
        accepted,
        submitted,
        approved,
        completed,
        canceled
    }

    struct Service {
        uint id;
        string title;
        string description;
        string category;
        address freelancer;
        address client;
        uint reward;
        uint deadline;
        uint createdAt;
        string url;
        Status status;
        uint256 positiveVotes;
        uint256 negativeVotes;
    }
    
    struct Voter {
        uint rank;
        uint reputation;
        uint totalVotes;
    }
    
    // mapping(uint256 => Work) public works;
    mapping(address => bool) public voters;
    mapping(address => Voter) public voterList;

    uint public servicesCount = 0;
    mapping(string => Service) services; // Have to remove public keyword

    struct ServiceRequest {
        uint id;
        string title;
        string description;
        string category;
        address payable client;
        address payable freelancer;
        uint256 reward;
        uint256 deadline;
        uint createdAt;
        Status status;
    }

    mapping(address => string[]) public userTitles;
    mapping(uint => string) public requestedTitles;
    mapping(address => string) public accountTypes;

    uint public serviceRequestsCount = 0;
    mapping(string => ServiceRequest) public serviceRequests;

    event ServiceRequestCreated(
        uint id,
        string title,
        string description,
        string category,
        uint reward,
        address payable client,
        uint deadline,
        uint createdAt
    );

    event ServiceRequestAccepted(
        uint requestId,
        string title,
        uint reward,
        address payable client,
        address payable freelancer,
        Status status
    );

    event WorkSubmitted(
        uint workId,
        string title,
        uint reward,
        uint deadline,
        string url,
        address payable freelancer,
        address payable client,
        uint submittedAt
    );

    event WorkAccepted(
        uint workId,
        string title,
        uint reward,
        uint deadline,
        string url,
        address payable freelancer,
        address payable client
    );

	event FLTPurchased(
        address buyer,
        uint etherAmount,
        uint FLTAmount,
        uint timestamp
    );

    event VoteCasted(uint256 indexed workId, address indexed voter, bool isApproval);

    constructor(FLTToken _fltToken, Ether _etherToken) {
        fLTToken = _fltToken;
        etherToken = _etherToken;
        owner = msg.sender;
    }

    function getAllServices() public view returns (Service[] memory) {
        Service[] memory allServices = new Service[](servicesCount);
        for (uint i = 0; i < servicesCount; i++) {
            allServices[i] = services[userTitles[msg.sender][i]];
        }
        return allServices;
    }
    
    function getAccountType() public view returns (string memory) {
        return accountTypes[msg.sender];
    }

    function setAccountType(string memory accountType) public {
        accountTypes[msg.sender] = accountType;
    }


    function getCurrentTime() internal view returns (uint256) {
        return block.timestamp * 1000;
    }

    function getAllUserTitles(
        address user
    ) public view returns (string[] memory) {
        return userTitles[user];
    }

    function getAllWorks() public view onlyOwner returns (Service[] memory) {
        Service[] memory allServices = new Service[](servicesCount);
        uint count = 0;
        for (uint i = 1; i < serviceRequestsCount + 1; i++) {
            string memory title = requestedTitles[i];
            Service memory service = services[title];

            if (service.id != 0) {
                allServices[count] = service;
                count++;
            }
        
        }
            return allServices;
    }

    function getAllUserServices(
        address user
    ) public view returns (Service[] memory) {

        // If user is owner, get all services
        if (user == owner) {
            return getAllWorks();
        }

        uint count = 0;
        for (uint i = 1; i < serviceRequestsCount + 1; i++) {
            string memory title = requestedTitles[i];
            Service memory service = services[title];
            if (service.client == user || service.freelancer == user) {
                count++;
            }
        }

        Service[] memory userServices = new Service[](count);

        for (uint i = 1; i < serviceRequestsCount + 1; i++) {
            string memory title = requestedTitles[i];
            Service memory service = services[title];
            if (service.client == user || service.freelancer == user) {
                // ???
                userServices[i - 1] = service;
            }
        }
        return userServices;
    }

    function getLastNRequestedServices(
        uint n
    ) public view returns (ServiceRequest[] memory) {
        if (n > serviceRequestsCount) {
            n = serviceRequestsCount;
        }
 
        string[] memory titles = new string[](n);

        for (uint i = 0; i < n; i++) {
            titles[i] = requestedTitles[serviceRequestsCount - i];
        }
        ServiceRequest[] memory requests = new ServiceRequest[](titles.length);

        for (uint i = 0; i < titles.length; i++) {
            requests[i] = serviceRequests[titles[i]];
        }
        return requests;
    }

    function requestService(
        string memory title,
        string memory description,
        string memory category,
        uint256 deadline,
        uint256 reward
    ) public {
        require(
            serviceRequests[title].status == Status.none,
            "Article already requested"
        );

        // Only continue when we successfully debit the user
        require(
            fLTToken.transferFrom(
                msg.sender,
                address(this),
                reward * (10 ** 18)
            ),
            "FLT transfer failed"
        );

        address payable client = payable(msg.sender);

        serviceRequests[title] = ServiceRequest(
            ++serviceRequestsCount,
            title,
            description,
            category,
            client,
            payable(address(0)),
            reward,
            deadline,
            getCurrentTime(),
            Status.requested
        );

        // Push topic into the user's titles mapping
        userTitles[client].push(title);

        // Add title to requested titles mapping
        requestedTitles[serviceRequestsCount] = title;

        // Emit event
        emit ServiceRequestCreated(
            serviceRequestsCount,
            title,
            description,
            category,
            reward,
            client,
            deadline,
            getCurrentTime()
        );
    }

    function acceptServiceRequest(string memory title) public {
        require(
            serviceRequests[title].status != Status.accepted,
            "Service has already been accepted."
        );
        address payable freelancer = payable(msg.sender);
        // Get service request
        ServiceRequest memory request = serviceRequests[title];

        require(
            request.client != msg.sender,
            "You cannot work on your service request."
        );

        // Set the serviceRequest's properties
        serviceRequests[title].freelancer = freelancer;
        serviceRequests[title].status = Status.accepted;

        // Emit event
        emit ServiceRequestAccepted(
            request.id,
            request.title,
            request.reward,
            request.client,
            freelancer,
            Status.accepted
        );
    }

	modifier onlyOwner {
      require(msg.sender == owner);
      _;
    }

    function calculateReward(
        uint deadline,
        uint submittedAt,
        uint reward
    ) private pure returns (uint) {
        if (submittedAt <= deadline) {
            // Submitted on time or before the deadline
            return reward;
        }
        uint delay = SafeMath.div(SafeMath.sub(submittedAt, deadline), 1000);

        if (delay <= 3600) {
            // Submitted within one hour after the deadline
            // Pay 80% of reward
            return SafeMath.div(reward * 8, 10);
        } else if (delay <= 10800) {
            // Submitted within three hours after the deadline
            // Pay 60% of reward
            return SafeMath.div(reward * 6, 10);
        }
        // No reward for submissions later than three hours after the deadline
        return 0;
    }

    function submitWork(
        string memory title,
        string memory url
    ) public {
        // Make sure the worker is submitting a work that has been requested
        require(
            serviceRequests[title].client != address(0),
            "Service has not been requested. Only requested services can be submitted."
        );

        // Get service request
        ServiceRequest memory request = serviceRequests[title];
        serviceRequests[title].status = Status.submitted; // Set status
        address payable freelancer = payable(msg.sender);
		address payable client = payable(request.client);

        // Make sure the person working on the article is the one submitting it
        require(
            payable(request.freelancer) == freelancer,
            "Only the assigned freelancer of a service can submit it."
        );

        uint currentTime = getCurrentTime();

        uint reward = calculateReward(
            request.deadline,
            currentTime,
            request.reward
        );

        if (reward < request.reward) {
            // Refund the client the difference since writer didn't submit on time.
            uint refundAmount = (request.reward - reward) * (10**18);
            require (
                fLTToken.transfer(client, refundAmount),
                "Refund failed"
            );
        }

        // Voter[] memory reviewers = new Voter[](3);

        services[title] = Service(
            ++servicesCount,
            title,
            request.description,
            request.category,
            freelancer,
            request.client,
            // reviewers,
            reward,
            request.deadline,
            currentTime,
            url,
            Status.submitted,
            0,
            0
        );

        emit WorkSubmitted(
            servicesCount,
            title,
            reward,
            request.deadline,
            url,
            freelancer,
            request.client,
            currentTime
        );
    }

    function approveService(string memory title) public {
        // Get service
        Service memory service = services[title];

        // Make sure only the requester of a service (client) can approve it
        require(
            service.client == msg.sender,
            "Only the person who requested the service can approve it."
        );

        // Approve service
        services[title].status = Status.completed;

        // Pay freelancer
        uint num = 10 ** 18;
        uint serviceReward = service.reward * num;
        address freelancer = service.freelancer;
        require(
            fLTToken.transfer(freelancer, serviceReward),
            "FLT transfer failed"
        );

        // Emit WorkAccepted event
        emit WorkAccepted(
            service.id,
            title,
            service.description,
            service.category,
            service.reward,
            payable(service.client),
            payable(service.freelancer),
            Status.completed
        );
    }

    function purchaseFLT(uint _etherAmount) public {
        // Check if amount is greater than 0
        if (_etherAmount < 0) {
            revert("Transfer mount cannot be 0");
        }

        require(!purchasingFLT, "Reentrancy protection: FLT is currently being purchased");
        purchasingFLT = true;

        uint num = 10 ** 18;

        // Get user's ether balance before transfer
        uint balanceBefore = etherToken.balanceOf(msg.sender);

        // Transfer the required amount of etherToken from the buyer to the marketplace contract
        require(
            etherToken.transferFrom(
                msg.sender,
                address(this),
                _etherAmount * num
            ),
            "EtherToken transfer failed"
        );

        // ensure that the transfer was successful 
        assert(etherToken.balanceOf(msg.sender) == balanceBefore - _etherAmount * num);

        uint balance = _etherAmount * num * TOKEN_PER_ETHER;

        // Transfer the required amount of FLT from the marketplace contract to the buyer
        require(
            fLTToken.transferFrom(owner, msg.sender, balance),
            "FLT transfer failed"
        );

		purchasingFLT = false;
        emit FLTPurchased(msg.sender, _etherAmount, balance, block.timestamp);
    }
    
    modifier onlyVoters() {
        require(voters[msg.sender], "You do not have voting privileges.");
        _;
    }
    
    function castVote(string memory title, bool _isApproval) external onlyVoters {
        Service storage work = services[title];
        require(work.id != 0, "Work does not exist.");
        // require(!work.status == Status.approved, "Work has already been approved.");
        
        if (_isApproval) {
            work.positiveVotes++;
        } else {
            work.negativeVotes++;
        }
        
        emit VoteCasted(work.id, msg.sender, _isApproval);
        
        if (work.positiveVotes >= 3) {
            // work.isApproved = true;
            emit WorkApproved(work.id, work.title, msg.sender);
        }
    }
    
    function addVoter(address _voter, uint256 _rank) external {
        require(!voters[_voter], "Voter already exists.");
        voters[_voter] = true;
        // voterRankings[_voter] = Voter(_rank);
    }
    
    function removeVoter(address _voter) external {
        require(voters[_voter], "Voter does not exist.");
        delete voters[_voter];
        // delete voterRankings[_voter];
    }
}
