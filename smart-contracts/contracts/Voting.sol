// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Voting {
    struct Election {
        string name;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool exists;
    }
    
    struct Candidate {
        uint256 id;
        string name;
        string party;
        uint256 voteCount;
        bool exists;
    }
    
    struct Position {
        uint256 id;
        string title;
        mapping(uint256 => Candidate) candidates;
        uint256[] candidateIds;
        uint256 totalVotes;
        bool exists;
    }
    
    struct Vote {
        uint256 electionId;
        uint256 positionId;
        uint256 candidateId;
        address voter;
        uint256 timestamp;
        string verificationCode;
    }
    
    mapping(uint256 => Election) public elections;
    mapping(uint256 => Position) public positions;
    mapping(uint256 => mapping(address => mapping(uint256 => bool))) public hasVoted; // electionId => voter => positionId => bool
    mapping(uint256 => Vote[]) public electionVotes;
    
    uint256 public nextElectionId;
    uint256 public nextPositionId;
    
    address public admin;
    
    event ElectionCreated(uint256 indexed electionId, string name, uint256 startTime, uint256 endTime);
    event PositionAdded(uint256 indexed electionId, uint256 indexed positionId, string title);
    event CandidateAdded(uint256 indexed electionId, uint256 indexed positionId, uint256 indexed candidateId, string name);
    event VoteCast(uint256 indexed electionId, uint256 indexed positionId, uint256 indexed candidateId, address voter, string verificationCode);
    event ElectionActivated(uint256 indexed electionId);
    event ElectionDeactivated(uint256 indexed electionId);
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }
    
    modifier electionExists(uint256 _electionId) {
        require(elections[_electionId].exists, "Election does not exist");
        _;
    }
    
    modifier electionActive(uint256 _electionId) {
        Election memory election = elections[_electionId];
        require(election.isActive, "Election is not active");
        require(block.timestamp >= election.startTime, "Election has not started");
        require(block.timestamp <= election.endTime, "Election has ended");
        _;
    }
    
    modifier positionExists(uint256 _electionId, uint256 _positionId) {
        require(positions[_positionId].exists, "Position does not exist");
        require(positions[_positionId].id == _positionId, "Invalid position");
        _;
    }
    
    constructor() {
        admin = msg.sender;
        nextElectionId = 1;
        nextPositionId = 1;
    }
    
    // Create a new election
    function createElection(
        string memory _name, 
        uint256 _startTime, 
        uint256 _endTime
    ) public onlyAdmin returns (uint256) {
        require(_startTime < _endTime, "Invalid time range");
        require(bytes(_name).length > 0, "Election name required");
        
        uint256 electionId = nextElectionId;
        elections[electionId] = Election({
            name: _name,
            startTime: _startTime,
            endTime: _endTime,
            isActive: false,
            exists: true
        });
        
        nextElectionId++;
        
        emit ElectionCreated(electionId, _name, _startTime, _endTime);
        return electionId;
    }
    
    // Add a position to an election
    function addPosition(uint256 _electionId, string memory _title) 
        public onlyAdmin electionExists(_electionId) returns (uint256) 
    {
        require(bytes(_title).length > 0, "Position title required");
        
        uint256 positionId = nextPositionId;
        Position storage position = positions[positionId];
        position.id = positionId;
        position.title = _title;
        position.exists = true;
        position.totalVotes = 0;
        
        nextPositionId++;
        
        emit PositionAdded(_electionId, positionId, _title);
        return positionId;
    }
    
    // Add a candidate to a position
    function addCandidate(
        uint256 _electionId, 
        uint256 _positionId, 
        string memory _name, 
        string memory _party
    ) public onlyAdmin electionExists(_electionId) positionExists(_electionId, _positionId) {
        require(bytes(_name).length > 0, "Candidate name required");
        
        Position storage position = positions[_positionId];
        uint256 candidateId = position.candidateIds.length + 1;
        
        position.candidates[candidateId] = Candidate({
            id: candidateId,
            name: _name,
            party: _party,
            voteCount: 0,
            exists: true
        });
        
        position.candidateIds.push(candidateId);
        
        emit CandidateAdded(_electionId, _positionId, candidateId, _name);
    }
    
    // Cast a vote
    function vote(
        uint256 _electionId,
        uint256 _positionId,
        uint256 _candidateId,
        string memory _verificationCode
    ) public electionExists(_electionId) electionActive(_electionId) positionExists(_electionId, _positionId) {
        
        require(!hasVoted[_electionId][msg.sender][_positionId], "Already voted for this position");
        
        Position storage position = positions[_positionId];
        require(position.candidates[_candidateId].exists, "Candidate does not exist");
        
        // Record the vote
        hasVoted[_electionId][msg.sender][_positionId] = true;
        position.candidates[_candidateId].voteCount++;
        position.totalVotes++;
        
        // Store vote record
        electionVotes[_electionId].push(Vote({
            electionId: _electionId,
            positionId: _positionId,
            candidateId: _candidateId,
            voter: msg.sender,
            timestamp: block.timestamp,
            verificationCode: _verificationCode
        }));
        
        emit VoteCast(_electionId, _positionId, _candidateId, msg.sender, _verificationCode);
    }
    
    // Get candidate vote count
    function getVoteCount(uint256 _electionId, uint256 _positionId, uint256 _candidateId) 
        public view returns (uint256) 
    {
        require(positions[_positionId].exists, "Position does not exist");
        require(positions[_positionId].candidates[_candidateId].exists, "Candidate does not exist");
        return positions[_positionId].candidates[_candidateId].voteCount;
    }
    
    // Get total votes for a position
    function getPositionTotalVotes(uint256 _positionId) public view returns (uint256) {
        require(positions[_positionId].exists, "Position does not exist");
        return positions[_positionId].totalVotes;
    }
    
    // Get all candidates for a position
    function getCandidates(uint256 _positionId) public view returns (uint256[] memory) {
        require(positions[_positionId].exists, "Position does not exist");
        return positions[_positionId].candidateIds;
    }
    
    // Get candidate details
    function getCandidate(uint256 _positionId, uint256 _candidateId) 
        public view returns (string memory, string memory, uint256) 
    {
        require(positions[_positionId].exists, "Position does not exist");
        require(positions[_positionId].candidates[_candidateId].exists, "Candidate does not exist");
        
        Candidate memory candidate = positions[_positionId].candidates[_candidateId];
        return (candidate.name, candidate.party, candidate.voteCount);
    }
    
    // Activate election
    function activateElection(uint256 _electionId) public onlyAdmin electionExists(_electionId) {
        elections[_electionId].isActive = true;
        emit ElectionActivated(_electionId);
    }
    
    // Deactivate election
    function deactivateElection(uint256 _electionId) public onlyAdmin electionExists(_electionId) {
        elections[_electionId].isActive = false;
        emit ElectionDeactivated(_electionId);
    }
    
    // Get election details
    function getElection(uint256 _electionId) public view returns (string memory, uint256, uint256, bool) {
        require(elections[_electionId].exists, "Election does not exist");
        Election memory election = elections[_electionId];
        return (election.name, election.startTime, election.endTime, election.isActive);
    }
    
    // Get total votes in election
    function getElectionTotalVotes(uint256 _electionId) public view returns (uint256) {
        return electionVotes[_electionId].length;
    }
    
    // Check if voter has voted for a position
    function hasVotedForPosition(uint256 _electionId, address _voter, uint256 _positionId) 
        public view returns (bool) 
    {
        return hasVoted[_electionId][_voter][_positionId];
    }
}