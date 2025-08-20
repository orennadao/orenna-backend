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
-- Name: LiftToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LiftToken" (
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


ALTER TABLE public."LiftToken" OWNER TO postgres;

--
-- Name: LiftTokenEvent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."LiftTokenEvent" (
    id integer NOT NULL,
    "liftTokenId" integer NOT NULL,
    type text NOT NULL,
    "eventAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "blockNumber" integer,
    "logIndex" integer,
    "txHash" text,
    payload jsonb,
    meta jsonb
);


ALTER TABLE public."LiftTokenEvent" OWNER TO postgres;

--
-- Name: LiftTokenEvent_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LiftTokenEvent_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LiftTokenEvent_id_seq" OWNER TO postgres;

--
-- Name: LiftTokenEvent_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LiftTokenEvent_id_seq" OWNED BY public."LiftTokenEvent".id;


--
-- Name: LiftToken_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."LiftToken_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."LiftToken_id_seq" OWNER TO postgres;

--
-- Name: LiftToken_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."LiftToken_id_seq" OWNED BY public."LiftToken".id;


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
-- Name: LiftToken id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftToken" ALTER COLUMN id SET DEFAULT nextval('public."LiftToken_id_seq"'::regclass);


--
-- Name: LiftTokenEvent id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftTokenEvent" ALTER COLUMN id SET DEFAULT nextval('public."LiftTokenEvent_id_seq"'::regclass);


--
-- Name: Project id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Project" ALTER COLUMN id SET DEFAULT nextval('public."Project_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


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
-- Name: LiftTokenEvent LiftTokenEvent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftTokenEvent"
    ADD CONSTRAINT "LiftTokenEvent_pkey" PRIMARY KEY (id);


--
-- Name: LiftToken LiftToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftToken"
    ADD CONSTRAINT "LiftToken_pkey" PRIMARY KEY (id);


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
-- Name: LiftTokenEvent_liftTokenId_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftTokenEvent_liftTokenId_type_idx" ON public."LiftTokenEvent" USING btree ("liftTokenId", type);


--
-- Name: LiftTokenEvent_liftTokenId_type_txHash_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftTokenEvent_liftTokenId_type_txHash_key" ON public."LiftTokenEvent" USING btree ("liftTokenId", type, "txHash");


--
-- Name: LiftTokenEvent_txHash_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftTokenEvent_txHash_idx" ON public."LiftTokenEvent" USING btree ("txHash");


--
-- Name: LiftToken_chainId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftToken_chainId_idx" ON public."LiftToken" USING btree ("chainId");


--
-- Name: LiftToken_contractAddress_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftToken_contractAddress_idx" ON public."LiftToken" USING btree ("contractAddress");


--
-- Name: LiftToken_externalId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftToken_externalId_key" ON public."LiftToken" USING btree ("externalId");


--
-- Name: LiftToken_mintRequestId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftToken_mintRequestId_key" ON public."LiftToken" USING btree ("mintRequestId");


--
-- Name: LiftToken_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftToken_status_idx" ON public."LiftToken" USING btree (status);


--
-- Name: LiftToken_tokenId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "LiftToken_tokenId_idx" ON public."LiftToken" USING btree ("tokenId");


--
-- Name: LiftToken_tokenId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "LiftToken_tokenId_key" ON public."LiftToken" USING btree ("tokenId");


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
-- Name: LiftTokenEvent LiftTokenEvent_liftTokenId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftTokenEvent"
    ADD CONSTRAINT "LiftTokenEvent_liftTokenId_fkey" FOREIGN KEY ("liftTokenId") REFERENCES public."LiftToken"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: LiftToken LiftToken_mintRequestId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftToken"
    ADD CONSTRAINT "LiftToken_mintRequestId_fkey" FOREIGN KEY ("mintRequestId") REFERENCES public."MintRequest"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LiftToken LiftToken_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."LiftToken"
    ADD CONSTRAINT "LiftToken_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

