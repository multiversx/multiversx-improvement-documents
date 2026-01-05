<!---December 19th 2025 test--->
<!---This is a test description of the december 19th devnet testing--->
# 1. Asynchronous Execution Model 
In the previous model, a leader had to execute transactions before proposing a block. In Supernova, the leader selects transactions from the pool and proposes the block without prior execution. Validators verify the proposal rules and vote immediately. Execution runs in parallel, and the results are typically notarized in the next block header

# 2. Updates to Block Structure and Notarization
- Header Changes: Block headers now include notarizations of prior execution results rather than current ones
- Mini-blocks: Proposed transactions are grouped into mini-blocks. If a transaction is unexecutable (e.g. nonce gaps), it is filtered out during the background execution phase, and the final result is referenced in subsequent headers
- Stuck Shard Prevention: If execution results fall too far behind new proposals (e.g. more than 3 nonces), dynamic block space estimation drops to zero, pausing new transactions until execution catches up

# 3. Safety and Determinism
- Virtual State Tracking: The transaction pool now maintains a "virtual state" tracker. It tracks the predicted nonces and balance changes of proposals that are currently in the execution queue to prevent invalid transactions from being proposed
- Legacy Cleanup: Upon activation, the protocol enforces a cleanup period where all previous "scheduled" and "partial" mini-blocks must be finalized before the new 600ms asynchronous rounds begin

4#. Transition Plan. 
The upgrade activates in phases to ensure network stability:
- Phase A: Timestamps switch to millisecond precision. The network processes remaining legacy scheduled execution items
- Phase B: After a synchronization period (approx. 200 rounds), the block time switches to 600ms, and the "Propose/Vote-then-Execute" logic goes live
<!---erd13hdpl7plj08x8mgnjtd7s3h4mflm67fnaxhfnm9t7ucgnzlvd4msun5m5v--->