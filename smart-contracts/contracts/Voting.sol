// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Vote {
        uint256 electionId;
        uint256 positionId;
        uint256 candidateId;
        address voter;
        uint256 timestamp;
    }
    
    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
    }
    
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // electionId => voter => bool
    mapping(uint256 => mapping(uint256 => uint256)) public voteCounts; // electionId => candidateId => count
    
    Vote[] public votes;
    uint256 public nextElectionId;
    
    address public admin;
    
    event VoteCast(uint256 indexed electionId, uint256 indexed candidateId, address indexed voter, uint256 timestamp);
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier electionActive(uint256 _electionId) {
        Election memory election = elections[_electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started");
        require(block.timestamp <= election.endTime, "Election has ended");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        nextElectionId = 1;
    }
    
    function createElection(string memory _name, uint256 _startTime, uint256 _endTime) public onlyAdmin returns (uint256) {
        require(_startTime < _endTime, "Invalid time range");
        
        uint256 electionId = nextElectionId;
        elections[electionId] = Election({
            name: _name,
            startTime: _startTime,
            endTime: _endTime,
            isActive: true
        });
        
        nextElectionId++;
        
        emit ElectionCreated(electionId, _name, _startTime, _endTime);
        return electionId;
    }
    
    function vote(uint256 _electionId, uint256 _positionId, uint256 _candidateId) public electionActive(_electionId) {
        require(!hasVoted[_electionId][msg.sender], "Already voted in this election");
        
        hasVoted[_electionId][msg.sender] = true;
        voteCounts[_electionId][_candidateId]++;
        
        votes.push(Vote({
            electionId: _electionId,
            positionId: _positionId,
            candidateId: _candidateId,
            voter: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit VoteCast(_electionId, _candidateId, msg.sender, block.timestamp);
    }
    
    function getVoteCount(uint256 _electionId, uint256 _candidateId) public view returns (uint256) {
        return voteCounts[_electionId][_candidateId];
    }
    
    function getTotalVotes(uint256 _electionId) public view returns (uint256) {
        uint256 total = 0;
        // In a real implementation, you'd track this differently
        // This is simplified for the prototype
        return votes.length;
    }
    
    function getVote(uint256 _voteIndex) public view returns (uint256, uint256, uint256, address, uint256) {
        Vote memory v = votes[_voteIndex];
        return (v.electionId, v.positionId, v.candidateId, v.voter, v.timestamp);
    }
    
    function endElection(uint256 _electionId) public onlyAdmin {
        Election storage election = elections[_electionId];
        require(election.isActive, "Election already ended");
        election.isActive = false;
    }
}