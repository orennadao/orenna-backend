--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (Debian 16.9-1.pgdg130+1)
-- Dumped by pg_dump version 16.9 (Debian 16.9-1.pgdg130+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: MintRequestEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MintRequestEventType" AS ENUM (
    'SUBMITTED',
    'REVIEWED',
    'APPROVED',
    'REJECTED',
    'CANCELLED',
    'MINT_STARTED',
    'MINT_COMPLETED',
    'MINT_FAILED'
);


ALTER TYPE public."MintRequestEventType" OWNER TO postgres;

--
-- Name: MintRequestStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MintRequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'MINTING',
    'COMPLETED',
    'REJECTED',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."MintRequestStatus" OWNER TO postgres;

--
-- Name: PaymentEventType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentEventType" AS ENUM (
    'PAYMENT_INITIATED',
    'PAYMENT_CONFIRMED',
    'ESCROW_DEPOSITED',
    'PROCEEDS_NOTIFIED',
    'FUNDS_DISTRIBUTED',
    'PAYMENT_FAILED',
    'PAYMENT_REFUNDED'
);


ALTER TYPE public."PaymentEventType" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'IN_ESCROW',
    'DISTRIBUTED',
    'FAILED',
    'CANCELLED',
    'REFUNDED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: PaymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentType" AS ENUM (
    'LIFT_UNIT_PURCHASE',
    'PROJECT_FUNDING',
    'REPAYMENT',
    'PLATFORM_FEE',
    'STEWARD_PAYMENT'
);


ALTER TYPE public."PaymentType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Contract; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Contract" (
    id integer NOT NULL,
    name text NOT NULL,
    symbol text,
    address text NOT NULL,
    "chainId" integer NOT NULL,
    type text NOT NULL,
    abi jsonb,
    "deployedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Contract" OWNER TO postgres;

--
-- Name: Contract_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Contract_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Contract_id_seq" OWNER TO postgres;

--
-- Name: Contract_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Contract_id_seq" OWNED BY public."Contract".id;


--
-- Name: IndexedEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IndexedEvent" (
    id text NOT NULL,
    "chainId" integer NOT NULL,
    "contractAddress" text NOT NULL,
    "eventName" text NOT NULL,
    "eventSignature" text NOT NULL,
    "blockNumber" integer NOT NULL,
    "blockHash" text NOT NULL,
    "blockTimestamp" timestamp(3) without time zone NOT NULL,
    "txHash" text NOT NULL,
    "txIndex" integer NOT NULL,
    "logIndex" integer NOT NULL,
    topics jsonb NOT NULL,
    data text NOT NULL,
    "decodedArgs" jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    "processedAt" timestamp(3) without time zone,
    "processingError" text,
    "retryCount" integer DEFAULT 0 NOT NULL,
    "maxRetries" integer DEFAULT 3 NOT NULL,
    "relatedPaymentId" text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."IndexedEvent" OWNER TO postgres;

--
-- Name: IndexerState; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."IndexerState" (
    id text NOT NULL,
    "chainId" integer NOT NULL,
    "contractAddress" text NOT NULL,
    "indexerType" text NOT NULL,
    "lastBlockNumber" integer DEFAULT 0 NOT NULL,
    "lastBlockHash" text,
    "lastSyncAt" timestamp(3) without time zone,
    "startBlock" integer DEFAULT 0 NOT NULL,
    confirmations integer DEFAULT 12 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "errorCount" integer DEFAULT 0 NOT NULL,
    "lastError" text,
    "lastErrorAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."IndexerState" OWNER TO postgres;

--
-- Name: LiftUnit; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LiftUnit" (
    id integer NOT NULL,
    "externalId" text,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    quantity numeric(65,30),
    unit text,
    "issuedAt" timestamp(3) without time zone,
    "retiredAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "chainId" integer,
    "contractAddress" text,
    "projectId" integer,
    "tokenId" text,
    meta jsonb,
    "mintRequestId" text
);


ALTER TABLE public."LiftUnit" OWNER TO postgres;

--
-- Name: LiftUnitEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LiftUnitEvent" (
    id integer NOT NULL,
    "liftUnitId" integer NOT NULL,
    type text NOT NULL,
    "eventAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "blockNumber" integer,
    "logIndex" integer,
    "txHash" text,
    payload jsonb,
    meta jsonb
);


ALTER TABLE public."LiftUnitEvent" OWNER TO postgres;

--
-- Name: LiftUnitEvent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LiftUnitEvent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LiftUnitEvent_id_seq" OWNER TO postgres;

--
-- Name: LiftUnitEvent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LiftUnitEvent_id_seq" OWNED BY public."LiftUnitEvent".id;


--
-- Name: LiftUnit_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LiftUnit_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LiftUnit_id_seq" OWNER TO postgres;

--
-- Name: LiftUnit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LiftUnit_id_seq" OWNED BY public."LiftUnit".id;


--
-- Name: MintRequest; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MintRequest" (
    id text NOT NULL,
    "projectId" integer NOT NULL,
    "tokenId" text NOT NULL,
    amount text NOT NULL,
    recipient text NOT NULL,
    "verificationData" jsonb,
    "verificationHash" text,
    title text NOT NULL,
    description text,
    "requestedBy" text NOT NULL,
    status public."MintRequestStatus" DEFAULT 'PENDING'::public."MintRequestStatus" NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "approvalNotes" text,
    "txHash" text,
    "blockNumber" integer,
    "executedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."MintRequest" OWNER TO postgres;

--
-- Name: MintRequestEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MintRequestEvent" (
    id text NOT NULL,
    "mintRequestId" text NOT NULL,
    type public."MintRequestEventType" NOT NULL,
    "performedBy" text NOT NULL,
    notes text,
    metadata jsonb,
    "txHash" text,
    "blockNumber" integer,
    "gasUsed" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MintRequestEvent" OWNER TO postgres;

--
-- Name: Payment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Payment" (
    id text NOT NULL,
    "paymentType" public."PaymentType" NOT NULL,
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "projectId" integer,
    amount text NOT NULL,
    "paymentToken" text NOT NULL,
    "chainId" integer NOT NULL,
    "payerAddress" text NOT NULL,
    "payerEmail" text,
    "recipientAddress" text NOT NULL,
    "escrowContract" text,
    "escrowConfig" jsonb,
    "txHash" text,
    "blockNumber" integer,
    "blockTimestamp" timestamp(3) without time zone,
    "proceedsNotified" boolean DEFAULT false NOT NULL,
    "distributionComplete" boolean DEFAULT false NOT NULL,
    description text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "confirmedAt" timestamp(3) without time zone
);


ALTER TABLE public."Payment" OWNER TO postgres;

--
-- Name: PaymentEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentEvent" (
    id text NOT NULL,
    "paymentId" text NOT NULL,
    type public."PaymentEventType" NOT NULL,
    "performedBy" text,
    amount text,
    "fromAddress" text,
    "toAddress" text,
    "txHash" text,
    "blockNumber" integer,
    "logIndex" integer,
    "gasUsed" text,
    notes text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaymentEvent" OWNER TO postgres;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Project" (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    "ownerAddress" text,
    "chainId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "contractAddress" text,
    meta jsonb
);


ALTER TABLE public."Project" OWNER TO postgres;

--
-- Name: ProjectPaymentConfig; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ProjectPaymentConfig" (
    id text NOT NULL,
    "projectId" integer NOT NULL,
    "allocationEscrow" text,
    "repaymentEscrow" text,
    "acceptsPayments" boolean DEFAULT false NOT NULL,
    "paymentTokens" jsonb,
    "platformFeeBps" integer,
    "platformFeeCap" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProjectPaymentConfig" OWNER TO postgres;

--
-- Name: Project_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Project_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Project_id_seq" OWNER TO postgres;

--
-- Name: Project_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Project_id_seq" OWNED BY public."Project".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "userId" integer NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    address text NOT NULL,
    username text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ensName" text
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: Contract id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contract" ALTER COLUMN id SET DEFAULT nextval('public."Contract_id_seq"'::regclass);


--
-- Name: LiftUnit id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnit" ALTER COLUMN id SET DEFAULT nextval('public."LiftUnit_id_seq"'::regclass);


--
-- Name: LiftUnitEvent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnitEvent" ALTER COLUMN id SET DEFAULT nextval('public."LiftUnitEvent_id_seq"'::regclass);


--
-- Name: Project id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project" ALTER COLUMN id SET DEFAULT nextval('public."Project_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Contract; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Contract" (id, name, symbol, address, "chainId", type, abi, "deployedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: IndexedEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IndexedEvent" (id, "chainId", "contractAddress", "eventName", "eventSignature", "blockNumber", "blockHash", "blockTimestamp", "txHash", "txIndex", "logIndex", topics, data, "decodedArgs", processed, "processedAt", "processingError", "retryCount", "maxRetries", "relatedPaymentId", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: IndexerState; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."IndexerState" (id, "chainId", "contractAddress", "indexerType", "lastBlockNumber", "lastBlockHash", "lastSyncAt", "startBlock", confirmations, "isActive", "errorCount", "lastError", "lastErrorAt", "createdAt", "updatedAt") FROM stdin;
cmedjzxiz0006jmjv2j062wie	1	0x1234567890123456789012345678901234567890	RepaymentEscrow	18006005	\N	2025-08-16 01:06:32.651	18000000	12	t	0	\N	\N	2025-08-16 01:03:32.22	2025-08-16 01:06:32.652
cmedjzxj40007jmjvnskbk4d6	1	0x0987654321098765432109876543210987654321	AllocationEscrow	18006005	\N	2025-08-16 01:06:32.786	18000000	12	t	0	\N	\N	2025-08-16 01:03:32.225	2025-08-16 01:06:32.787
\.


--
-- Data for Name: LiftUnit; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LiftUnit" (id, "externalId", status, quantity, unit, "issuedAt", "retiredAt", "createdAt", "updatedAt", "chainId", "contractAddress", "projectId", "tokenId", meta, "mintRequestId") FROM stdin;
\.


--
-- Data for Name: LiftUnitEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."LiftUnitEvent" (id, "liftUnitId", type, "eventAt", "createdAt", "blockNumber", "logIndex", "txHash", payload, meta) FROM stdin;
\.


--
-- Data for Name: MintRequest; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MintRequest" (id, "projectId", "tokenId", amount, recipient, "verificationData", "verificationHash", title, description, "requestedBy", status, "reviewedBy", "reviewedAt", "approvalNotes", "txHash", "blockNumber", "executedAt", "createdAt", "updatedAt") FROM stdin;
cmec6i6t30001umi6zn9bjb88	1	1001	100	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	{"areaSize": "50 hectares", "waterQuality": "Improved - pH 7.2, turbidity reduced 30%", "biodiversityIndex": "Increased by 15%", "carbonSequestered": "125 tons CO2", "measurementPeriod": "6 months", "verificationMethod": "Soil sampling + satellite imagery"}	QmX4B9K2nE8F7H3L5M9N0P2Q6R8S1T4U7V0W3X6Y9Z2A5B8C1	Forest Carbon Sequestration Verification	Verified carbon sequestration from 50 hectares of reforested land. Measurements show 2.5 tons CO2/hectare sequestered over 6 months.	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	FAILED	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	2025-08-15 02:02:23.334	Verification data looks solid. Carbon measurements verified through satellite imagery and soil sampling. Approving for minting.	\N	\N	2025-08-15 02:38:23.079	2025-08-15 01:58:03.254	2025-08-15 02:38:24.61
\.


--
-- Data for Name: MintRequestEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MintRequestEvent" (id, "mintRequestId", type, "performedBy", notes, metadata, "txHash", "blockNumber", "gasUsed", "createdAt") FROM stdin;
cmec6i6th0003umi63l9vtf3n	cmec6i6t30001umi6zn9bjb88	SUBMITTED	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	Test mint request for forest carbon sequestration	{"testRequest": true, "authorizationReason": "Project owner"}	\N	\N	\N	2025-08-15 01:58:03.269
cmec6nrhp0005umi69qnmzc2y	cmec6i6t30001umi6zn9bjb88	APPROVED	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	Verification data looks solid. Carbon measurements verified through satellite imagery and soil sampling. Approving for minting.	{"testApproval": true, "previousStatus": "PENDING"}	\N	\N	\N	2025-08-15 02:02:23.342
cmec7y1yn000111hilaj726at	cmec6i6t30001umi6zn9bjb88	MINT_STARTED	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	Starting blockchain minting process	{"timestamp": "2025-08-15T02:38:23.086Z"}	\N	\N	\N	2025-08-15 02:38:23.087
cmec7y353000311hikg4yxodg	cmec6i6t30001umi6zn9bjb88	MINT_FAILED	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	Failed to create token: Token creation failed: Missing or invalid parameters.\nDouble check you have provided the correct parameters.\n\nURL: https://eth.llamarpc.com\nRequest body: {"method":"eth_estimateGas","params":[{"data":"0x5f78f43600000000000000000000000000000000000000000000000000000000000003e900000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000032687474703a2f2f6c6f63616c686f73743a333030302f6170692f6c6966742d756e6974732f313030312f6d657461646174610000000000000000000000000000","from":"0x2e988A386a799F506693793c6A5AF6B54dfAaBfB","maxFeePerGas":"0x242e4c47","maxPriorityFeePerGas":"0xbf68","nonce":"0x19","to":"0x1234567890123456789012345678901234567890"}]}\n \nEstimate Gas Arguments:\n  from:                  0x2e988A386a799F506693793c6A5AF6B54dfAaBfB\n  to:                    0x1234567890123456789012345678901234567890\n  data:                  0x5f78f43600000000000000000000000000000000000000000000000000000000000003e900000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000032687474703a2f2f6c6f63616c686f73743a333030302f6170692f6c6966742d756e6974732f313030312f6d657461646174610000000000000000000000000000\n  maxFeePerGas:          0.607013959 gwei\n  maxPriorityFeePerGas:  0.000049 gwei\n  nonce:                 25\n \nRequest Arguments:\n  from:  0x2e988A386a799F506693793c6A5AF6B54dfAaBfB\n  to:    0x1234567890123456789012345678901234567890\n  data:  0x5f78f43600000000000000000000000000000000000000000000000000000000000003e900000000000000000000000000000000000000000000000000000000000f424000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000032687474703a2f2f6c6f63616c686f73743a333030302f6170692f6c6966742d756e6974732f313030312f6d657461646174610000000000000000000000000000\n \nContract Call:\n  address:   0x1234567890123456789012345678901234567890\n  function:  createToken(uint256 id, uint256 cap, string customUri)\n  args:                 (1001, 1000000, http://localhost:3000/api/lift-units/1001/metadata)\n  sender:    0x2e988A386a799F506693793c6A5AF6B54dfAaBfB\n\nDocs: https://viem.sh/docs/contract/writeContract\nDetails: gas required exceeds allowance (0)\nVersion: viem@2.33.3	{"timestamp": "2025-08-15T02:38:24.614Z"}	\N	\N	\N	2025-08-15 02:38:24.615
\.


--
-- Data for Name: Payment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Payment" (id, "paymentType", status, "projectId", amount, "paymentToken", "chainId", "payerAddress", "payerEmail", "recipientAddress", "escrowContract", "escrowConfig", "txHash", "blockNumber", "blockTimestamp", "proceedsNotified", "distributionComplete", description, metadata, "createdAt", "updatedAt", "confirmedAt") FROM stdin;
cmedjx8cg0003jmjvwwr1j10x	LIFT_UNIT_PURCHASE	PENDING	3	1000000000000000000	0x0000000000000000000000000000000000000000	1	0xd8da6bf26964af9d7eed9e03e53415d37aa96045	\N	0xd8da6bf26964af9d7eed9e03e53415d37aa96045	\N	\N	\N	\N	\N	f	f	Smoke test payment for lift units	\N	2025-08-16 01:01:26.271	2025-08-16 01:01:26.271	\N
\.


--
-- Data for Name: PaymentEvent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentEvent" (id, "paymentId", type, "performedBy", amount, "fromAddress", "toAddress", "txHash", "blockNumber", "logIndex", "gasUsed", notes, metadata, "createdAt") FROM stdin;
cmedjx8ck0005jmjvu1z5b16u	cmedjx8cg0003jmjvwwr1j10x	PAYMENT_INITIATED	0xd8da6bf26964af9d7eed9e03e53415d37aa96045	1000000000000000000	\N	\N	\N	\N	\N	\N	Payment initiated for LIFT_UNIT_PURCHASE	{"request": {"amount": "1000000000000000000", "chainId": 1, "tokenIds": ["1001"], "projectId": 3, "description": "Smoke test payment for lift units", "paymentType": "LIFT_UNIT_PURCHASE", "payerAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", "paymentToken": "0x0000000000000000000000000000000000000000", "tokenAmounts": ["100"], "recipientAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}}	2025-08-16 01:01:26.277
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Project" (id, name, slug, description, "ownerAddress", "chainId", "createdAt", "updatedAt", "contractAddress", meta) FROM stdin;
1	Test Regenerative Project	test-project-1755186765603	A test project for mint request authorization	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	1	2025-08-14 15:52:45.605	2025-08-14 15:52:45.605	\N	\N
2	Test Regenerative Project	test-project-1755186878620	A test project for mint request authorization	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	1	2025-08-14 15:54:38.621	2025-08-14 15:54:38.621	\N	\N
3	Test Regenerative Project	test-project-1755306048258	A test project for mint request authorization	0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045	1	2025-08-16 01:00:48.26	2025-08-16 01:00:48.26	\N	\N
\.


--
-- Data for Name: ProjectPaymentConfig; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ProjectPaymentConfig" (id, "projectId", "allocationEscrow", "repaymentEscrow", "acceptsPayments", "paymentTokens", "platformFeeBps", "platformFeeCap", "createdAt", "updatedAt") FROM stdin;
cmedjwt0e0001jmjv941xz2eo	3	0x1234567890123456789012345678901234567890	0x0987654321098765432109876543210987654321	t	["0x0000000000000000000000000000000000000000", "0xA0b86a33E6441C8C8b4cA1b23B977999Df8b0C1C"]	250	1000000000000000000	2025-08-16 01:01:06.393	2025-08-16 01:01:06.393
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", token, "expiresAt", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, address, username, "createdAt", "updatedAt", "ensName") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
5ab975b3-ccf2-40ec-895e-bb62c16a32b7	c0b3dc06c94e269fe0fbb35ab6b5a6c0327186bc175dafff7c3cd18975cbdd55	2025-08-13 21:18:36.665+00	20250813211836_init	\N	\N	2025-08-13 21:18:36.639101+00	1
60ee9d29-5854-4094-80cb-be34ee7e763b	4c9a94ef1e51c0e1004a2f075f681fab03980fc3b676858899d74ed9cff8c0c4	2025-08-13 22:21:03.40892+00	20250813211837_blockchain	\N	\N	2025-08-13 22:21:03.383102+00	1
8c402577-1272-4f3e-8d98-a0c2cc8b8c30	38ad49b3a12b078290c0e9e98d6fe0b3fe41dedf257a32572e1ee3ea21ec1f5d	2025-08-14 01:59:19.357915+00	20250814015919_init	\N	\N	2025-08-14 01:59:19.335273+00	1
a466d2bd-8b00-4f7f-9e14-e8612f1e7de0	dce1a093c4e4dbfb6561eaaa989b8df5acaa22a1a065158ec89a2e049872b7cd	2025-08-16 00:51:59.188253+00	20250816005159_init	\N	\N	2025-08-16 00:51:59.131724+00	1
\.


--
-- Name: Contract_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Contract_id_seq"', 1, false);


--
-- Name: LiftUnitEvent_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LiftUnitEvent_id_seq"', 1, false);


--
-- Name: LiftUnit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."LiftUnit_id_seq"', 1, false);


--
-- Name: Project_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Project_id_seq"', 3, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 1, false);


--
-- Name: Contract Contract_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Contract"
    ADD CONSTRAINT "Contract_pkey" PRIMARY KEY (id);


--
-- Name: IndexedEvent IndexedEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IndexedEvent"
    ADD CONSTRAINT "IndexedEvent_pkey" PRIMARY KEY (id);


--
-- Name: IndexerState IndexerState_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IndexerState"
    ADD CONSTRAINT "IndexerState_pkey" PRIMARY KEY (id);


--
-- Name: LiftUnitEvent LiftUnitEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnitEvent"
    ADD CONSTRAINT "LiftUnitEvent_pkey" PRIMARY KEY (id);


--
-- Name: LiftUnit LiftUnit_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnit"
    ADD CONSTRAINT "LiftUnit_pkey" PRIMARY KEY (id);


--
-- Name: MintRequestEvent MintRequestEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MintRequestEvent"
    ADD CONSTRAINT "MintRequestEvent_pkey" PRIMARY KEY (id);


--
-- Name: MintRequest MintRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MintRequest"
    ADD CONSTRAINT "MintRequest_pkey" PRIMARY KEY (id);


--
-- Name: PaymentEvent PaymentEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentEvent"
    ADD CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY (id);


--
-- Name: Payment Payment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_pkey" PRIMARY KEY (id);


--
-- Name: ProjectPaymentConfig ProjectPaymentConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectPaymentConfig"
    ADD CONSTRAINT "ProjectPaymentConfig_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Contract_address_chainId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Contract_address_chainId_key" ON public."Contract" USING btree (address, "chainId");


--
-- Name: Contract_chainId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Contract_chainId_type_idx" ON public."Contract" USING btree ("chainId", type);


--
-- Name: IndexedEvent_blockNumber_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_blockNumber_idx" ON public."IndexedEvent" USING btree ("blockNumber");


--
-- Name: IndexedEvent_chainId_contractAddress_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_chainId_contractAddress_idx" ON public."IndexedEvent" USING btree ("chainId", "contractAddress");


--
-- Name: IndexedEvent_chainId_txHash_logIndex_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IndexedEvent_chainId_txHash_logIndex_key" ON public."IndexedEvent" USING btree ("chainId", "txHash", "logIndex");


--
-- Name: IndexedEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_createdAt_idx" ON public."IndexedEvent" USING btree ("createdAt");


--
-- Name: IndexedEvent_eventName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_eventName_idx" ON public."IndexedEvent" USING btree ("eventName");


--
-- Name: IndexedEvent_processed_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_processed_idx" ON public."IndexedEvent" USING btree (processed);


--
-- Name: IndexedEvent_txHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexedEvent_txHash_idx" ON public."IndexedEvent" USING btree ("txHash");


--
-- Name: IndexerState_chainId_contractAddress_indexerType_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "IndexerState_chainId_contractAddress_indexerType_key" ON public."IndexerState" USING btree ("chainId", "contractAddress", "indexerType");


--
-- Name: IndexerState_chainId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexerState_chainId_idx" ON public."IndexerState" USING btree ("chainId");


--
-- Name: IndexerState_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexerState_isActive_idx" ON public."IndexerState" USING btree ("isActive");


--
-- Name: IndexerState_lastSyncAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IndexerState_lastSyncAt_idx" ON public."IndexerState" USING btree ("lastSyncAt");


--
-- Name: LiftUnitEvent_liftUnitId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnitEvent_liftUnitId_type_idx" ON public."LiftUnitEvent" USING btree ("liftUnitId", type);


--
-- Name: LiftUnitEvent_liftUnitId_type_txHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftUnitEvent_liftUnitId_type_txHash_key" ON public."LiftUnitEvent" USING btree ("liftUnitId", type, "txHash");


--
-- Name: LiftUnitEvent_txHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnitEvent_txHash_idx" ON public."LiftUnitEvent" USING btree ("txHash");


--
-- Name: LiftUnit_chainId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnit_chainId_idx" ON public."LiftUnit" USING btree ("chainId");


--
-- Name: LiftUnit_contractAddress_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnit_contractAddress_idx" ON public."LiftUnit" USING btree ("contractAddress");


--
-- Name: LiftUnit_externalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftUnit_externalId_key" ON public."LiftUnit" USING btree ("externalId");


--
-- Name: LiftUnit_mintRequestId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftUnit_mintRequestId_key" ON public."LiftUnit" USING btree ("mintRequestId");


--
-- Name: LiftUnit_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnit_status_idx" ON public."LiftUnit" USING btree (status);


--
-- Name: LiftUnit_tokenId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftUnit_tokenId_idx" ON public."LiftUnit" USING btree ("tokenId");


--
-- Name: LiftUnit_tokenId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftUnit_tokenId_key" ON public."LiftUnit" USING btree ("tokenId");


--
-- Name: MintRequestEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequestEvent_createdAt_idx" ON public."MintRequestEvent" USING btree ("createdAt");


--
-- Name: MintRequestEvent_mintRequestId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequestEvent_mintRequestId_idx" ON public."MintRequestEvent" USING btree ("mintRequestId");


--
-- Name: MintRequestEvent_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequestEvent_type_idx" ON public."MintRequestEvent" USING btree (type);


--
-- Name: MintRequest_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequest_createdAt_idx" ON public."MintRequest" USING btree ("createdAt");


--
-- Name: MintRequest_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequest_projectId_idx" ON public."MintRequest" USING btree ("projectId");


--
-- Name: MintRequest_requestedBy_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequest_requestedBy_idx" ON public."MintRequest" USING btree ("requestedBy");


--
-- Name: MintRequest_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "MintRequest_status_idx" ON public."MintRequest" USING btree (status);


--
-- Name: PaymentEvent_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentEvent_createdAt_idx" ON public."PaymentEvent" USING btree ("createdAt");


--
-- Name: PaymentEvent_paymentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentEvent_paymentId_idx" ON public."PaymentEvent" USING btree ("paymentId");


--
-- Name: PaymentEvent_txHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentEvent_txHash_idx" ON public."PaymentEvent" USING btree ("txHash");


--
-- Name: PaymentEvent_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PaymentEvent_type_idx" ON public."PaymentEvent" USING btree (type);


--
-- Name: Payment_chainId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_chainId_idx" ON public."Payment" USING btree ("chainId");


--
-- Name: Payment_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_createdAt_idx" ON public."Payment" USING btree ("createdAt");


--
-- Name: Payment_payerAddress_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_payerAddress_idx" ON public."Payment" USING btree ("payerAddress");


--
-- Name: Payment_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_projectId_idx" ON public."Payment" USING btree ("projectId");


--
-- Name: Payment_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_status_idx" ON public."Payment" USING btree (status);


--
-- Name: Payment_txHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Payment_txHash_idx" ON public."Payment" USING btree ("txHash");


--
-- Name: ProjectPaymentConfig_projectId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ProjectPaymentConfig_projectId_key" ON public."ProjectPaymentConfig" USING btree ("projectId");


--
-- Name: Project_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Project_slug_key" ON public."Project" USING btree (slug);


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: Session_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Session_userId_idx" ON public."Session" USING btree ("userId");


--
-- Name: User_address_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_address_key" ON public."User" USING btree (address);


--
-- Name: IndexedEvent IndexedEvent_relatedPaymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."IndexedEvent"
    ADD CONSTRAINT "IndexedEvent_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LiftUnitEvent LiftUnitEvent_liftUnitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnitEvent"
    ADD CONSTRAINT "LiftUnitEvent_liftUnitId_fkey" FOREIGN KEY ("liftUnitId") REFERENCES public."LiftUnit"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiftUnit LiftUnit_mintRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnit"
    ADD CONSTRAINT "LiftUnit_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES public."MintRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LiftUnit LiftUnit_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftUnit"
    ADD CONSTRAINT "LiftUnit_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MintRequestEvent MintRequestEvent_mintRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MintRequestEvent"
    ADD CONSTRAINT "MintRequestEvent_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES public."MintRequest"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: MintRequest MintRequest_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MintRequest"
    ADD CONSTRAINT "MintRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PaymentEvent PaymentEvent_paymentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentEvent"
    ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES public."Payment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Payment Payment_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Payment"
    ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProjectPaymentConfig ProjectPaymentConfig_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ProjectPaymentConfig"
    ADD CONSTRAINT "ProjectPaymentConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

