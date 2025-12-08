/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

//! Sentience Platform - JavaScript agent for semantic tree extraction

/// The JavaScript agent script that extracts semantic accessibility tree from web pages.
/// Loaded at compile-time from agent.js for better syntax highlighting and maintainability.
pub const AGENT_SCRIPT: &str = include_str!("agent.js");

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn agent_script_is_not_empty() {
        assert!(!AGENT_SCRIPT.is_empty());
        assert!(AGENT_SCRIPT.contains("buildSemanticTree"));
    }
}
