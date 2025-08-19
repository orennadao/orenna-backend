// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ProjectNFT.sol";

contract ProjectNFTTest is Test {
    ProjectNFT public projectNFT;
    address public admin = address(0x1);
    address public registry = address(0x2);
    address public verifier = address(0x3);
    address public projectOwner = address(0x4);
    address public user = address(0x5);

    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    string constant TEST_TOKEN_URI = "ipfs://QmTest1";
    string constant TEST_REGISTRY_URI = "ipfs://QmTest2";
    bytes32 constant TEST_DATA_HASH = keccak256("test data");
    string constant TEST_REPORT_URI = "ipfs://QmTestReport";
    bytes32 constant TEST_REPORT_HASH = keccak256("test report");

    event ProjectCreated(
        uint256 indexed projectId,
        address indexed owner,
        string tokenURI,
        string registryDataURI,
        bytes32 dataHash,
        uint256 schemaVersion
    );

    event ProjectStateChanged(
        uint256 indexed projectId,
        uint8 prevState,
        uint8 newState
    );

    event ProjectURIsUpdated(
        uint256 indexed projectId,
        string tokenURI,
        string registryDataURI,
        bytes32 dataHash,
        uint256 schemaVersion
    );

    event VerifierAttested(
        uint256 indexed projectId,
        uint256 round,
        bytes32 reportHash,
        string reportURI
    );

    function setUp() public {
        // Deploy the implementation
        projectNFT = new ProjectNFT();
        
        // Initialize with admin
        projectNFT.initialize(admin);
        
        // Grant roles
        vm.startPrank(admin);
        projectNFT.grantRole(REGISTRY_ADMIN_ROLE, registry);
        projectNFT.grantRole(VERIFIER_ROLE, verifier);
        vm.stopPrank();
    }

    function testInitialization() public view {
        assertEq(projectNFT.name(), "Orenna Project");
        assertEq(projectNFT.symbol(), "ORP");
        assertTrue(projectNFT.hasRole(projectNFT.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(projectNFT.hasRole(REGISTRY_ADMIN_ROLE, registry));
        assertTrue(projectNFT.hasRole(VERIFIER_ROLE, verifier));
    }

    function testCreateProject() public {
        vm.prank(registry);
        
        vm.expectEmit(true, true, false, true);
        emit ProjectCreated(1, projectOwner, TEST_TOKEN_URI, TEST_REGISTRY_URI, TEST_DATA_HASH, 1);
        
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        assertEq(projectId, 1);
        assertEq(projectNFT.ownerOf(projectId), projectOwner);
        
        IProjectNFT.ProjectInfo memory info = projectNFT.info(projectId);
        assertEq(info.projectId, 1);
        assertEq(info.owner, projectOwner);
        assertEq(info.tokenURI, TEST_TOKEN_URI);
        assertEq(info.registryDataURI, TEST_REGISTRY_URI);
        assertEq(info.dataHash, TEST_DATA_HASH);
        assertEq(info.state, 0); // DRAFT
        assertEq(info.schemaVersion, 1);
        
        // Check project owner role was granted
        bytes32 projectOwnerRole = keccak256(abi.encodePacked("PROJECT_OWNER_", projectId));
        assertTrue(projectNFT.hasRole(projectOwnerRole, projectOwner));
    }

    function testCreateProjectUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
    }

    function testCreateProjectsBatch() public {
        address[] memory owners = new address[](3);
        string[] memory tokenURIs = new string[](3);
        string[] memory registryURIs = new string[](3);
        bytes32[] memory dataHashes = new bytes32[](3);
        
        for (uint i = 0; i < 3; i++) {
            owners[i] = address(uint160(100 + i));
            tokenURIs[i] = string(abi.encodePacked("ipfs://token", vm.toString(i)));
            registryURIs[i] = string(abi.encodePacked("ipfs://registry", vm.toString(i)));
            dataHashes[i] = keccak256(abi.encodePacked("data", i));
        }
        
        vm.prank(registry);
        uint256[] memory projectIds = projectNFT.createProjectsBatch(
            owners,
            tokenURIs,
            registryURIs,
            dataHashes
        );
        
        assertEq(projectIds.length, 3);
        for (uint i = 0; i < 3; i++) {
            assertEq(projectIds[i], i + 1);
            assertEq(projectNFT.ownerOf(projectIds[i]), owners[i]);
        }
    }

    function testCreateProjectsBatchMismatchedArrays() public {
        address[] memory owners = new address[](2);
        string[] memory tokenURIs = new string[](3);
        string[] memory registryURIs = new string[](3);
        bytes32[] memory dataHashes = new bytes32[](3);
        
        vm.prank(registry);
        vm.expectRevert("Array length mismatch");
        projectNFT.createProjectsBatch(
            owners,
            tokenURIs,
            registryURIs,
            dataHashes
        );
    }

    function testSetProjectState() public {
        // Create a project first
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        // Test state change by registry admin
        vm.prank(registry);
        vm.expectEmit(true, false, false, true);
        emit ProjectStateChanged(projectId, 0, 1);
        
        projectNFT.setProjectState(projectId, 1); // BASELINED
        
        IProjectNFT.ProjectInfo memory info = projectNFT.info(projectId);
        assertEq(info.state, 1);
        
        // Test state change by project owner
        vm.prank(projectOwner);
        projectNFT.setProjectState(projectId, 2); // ACTIVE_FUNDRAISING
        
        info = projectNFT.info(projectId);
        assertEq(info.state, 2);
    }

    function testSetProjectStateUnauthorized() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        vm.prank(user);
        vm.expectRevert("Insufficient permissions");
        projectNFT.setProjectState(projectId, 1);
    }

    function testSetProjectStateNonexistent() public {
        vm.prank(registry);
        vm.expectRevert("Project does not exist");
        projectNFT.setProjectState(999, 1);
    }

    function testSetProjectStatesBatch() public {
        // Create multiple projects
        vm.startPrank(registry);
        uint256 projectId1 = projectNFT.createProject(projectOwner, TEST_TOKEN_URI, TEST_REGISTRY_URI, TEST_DATA_HASH);
        uint256 projectId2 = projectNFT.createProject(projectOwner, TEST_TOKEN_URI, TEST_REGISTRY_URI, TEST_DATA_HASH);
        
        uint256[] memory projectIds = new uint256[](2);
        projectIds[0] = projectId1;
        projectIds[1] = projectId2;
        
        uint8[] memory newStates = new uint8[](2);
        newStates[0] = 1; // BASELINED
        newStates[1] = 1; // BASELINED
        
        projectNFT.setProjectStatesBatch(projectIds, newStates);
        vm.stopPrank();
        
        assertEq(projectNFT.info(projectId1).state, 1);
        assertEq(projectNFT.info(projectId2).state, 1);
    }

    function testUpdateURIs() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        string memory newTokenURI = "ipfs://QmNewToken";
        string memory newRegistryURI = "ipfs://QmNewRegistry";
        bytes32 newDataHash = keccak256("new data");
        
        vm.prank(projectOwner);
        vm.expectEmit(true, false, false, true);
        emit ProjectURIsUpdated(projectId, newTokenURI, newRegistryURI, newDataHash, 1);
        
        projectNFT.updateURIs(projectId, newTokenURI, newRegistryURI, newDataHash);
        
        IProjectNFT.ProjectInfo memory info = projectNFT.info(projectId);
        assertEq(info.tokenURI, newTokenURI);
        assertEq(info.registryDataURI, newRegistryURI);
        assertEq(info.dataHash, newDataHash);
    }

    function testUpdateURIsUnauthorized() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        vm.prank(user);
        vm.expectRevert("Insufficient permissions");
        projectNFT.updateURIs(projectId, "new", "new", keccak256("new"));
    }

    function testAttestVerification() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        vm.prank(verifier);
        vm.expectEmit(true, false, false, true);
        emit VerifierAttested(projectId, 1, TEST_REPORT_HASH, TEST_REPORT_URI);
        
        projectNFT.attestVerification(projectId, 1, TEST_REPORT_HASH, TEST_REPORT_URI);
    }

    function testAttestVerificationUnauthorized() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        vm.prank(user);
        vm.expectRevert();
        projectNFT.attestVerification(projectId, 1, TEST_REPORT_HASH, TEST_REPORT_URI);
    }

    function testAttestVerificationNonexistent() public {
        vm.prank(verifier);
        vm.expectRevert("Project does not exist");
        projectNFT.attestVerification(999, 1, TEST_REPORT_HASH, TEST_REPORT_URI);
    }

    function testTokenURI() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        assertEq(projectNFT.tokenURI(projectId), TEST_TOKEN_URI);
    }

    function testTokenURINonexistent() public {
        vm.expectRevert("URI query for nonexistent token");
        projectNFT.tokenURI(999);
    }

    function testPauseUnpause() public {
        // Test pause functionality
        vm.prank(admin);
        projectNFT.pause();
        assertTrue(projectNFT.paused());
        
        // Should not be able to create projects when paused
        vm.prank(registry);
        vm.expectRevert();
        projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        // Test unpause
        vm.prank(admin);
        projectNFT.unpause();
        assertFalse(projectNFT.paused());
        
        // Should be able to create projects again
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        assertEq(projectId, 1);
    }

    function testPauseUnauthorized() public {
        vm.prank(user);
        vm.expectRevert();
        projectNFT.pause();
    }

    function testTransferWhenPaused() public {
        // Create a project
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        // Pause the contract
        vm.prank(admin);
        projectNFT.pause();
        
        // Should not be able to transfer when paused
        vm.prank(projectOwner);
        vm.expectRevert("Token transfers paused");
        projectNFT.transferFrom(projectOwner, user, projectId);
    }

    function testSupportsInterface() public view {
        // Test ERC721 interface
        assertTrue(projectNFT.supportsInterface(0x80ac58cd));
        // Test AccessControl interface
        assertTrue(projectNFT.supportsInterface(0x7965db0b));
        // Test ERC165 interface
        assertTrue(projectNFT.supportsInterface(0x01ffc9a7));
    }

    function testProjectInfoView() public {
        vm.prank(registry);
        uint256 projectId = projectNFT.createProject(
            projectOwner,
            TEST_TOKEN_URI,
            TEST_REGISTRY_URI,
            TEST_DATA_HASH
        );
        
        IProjectNFT.ProjectInfo memory info = projectNFT.info(projectId);
        assertEq(info.projectId, projectId);
        assertEq(info.owner, projectOwner);
        assertEq(info.tokenURI, TEST_TOKEN_URI);
        assertEq(info.registryDataURI, TEST_REGISTRY_URI);
        assertEq(info.dataHash, TEST_DATA_HASH);
        assertEq(info.state, 0);
        assertEq(info.schemaVersion, 1);
    }

    function testProjectInfoNonexistent() public {
        vm.expectRevert("Project does not exist");
        projectNFT.info(999);
    }

    function testMultipleProjects() public {
        vm.startPrank(registry);
        
        uint256 projectId1 = projectNFT.createProject(
            projectOwner,
            "uri1",
            "registry1",
            keccak256("data1")
        );
        
        uint256 projectId2 = projectNFT.createProject(
            address(0x6),
            "uri2",
            "registry2",
            keccak256("data2")
        );
        
        vm.stopPrank();
        
        assertEq(projectId1, 1);
        assertEq(projectId2, 2);
        
        assertEq(projectNFT.ownerOf(projectId1), projectOwner);
        assertEq(projectNFT.ownerOf(projectId2), address(0x6));
        
        IProjectNFT.ProjectInfo memory info1 = projectNFT.info(projectId1);
        IProjectNFT.ProjectInfo memory info2 = projectNFT.info(projectId2);
        
        assertEq(info1.tokenURI, "uri1");
        assertEq(info2.tokenURI, "uri2");
    }

    function testSchemaVersionConstant() public view {
        assertEq(projectNFT.CURRENT_SCHEMA_VERSION(), 1);
    }
}