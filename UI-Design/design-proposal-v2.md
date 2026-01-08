# Design Proposal v2 (Post-Feedback Iteration)
Project: COMP2003 (Group 6)  
Author: Aarju Shrestha  
Semester: Year-long project – Semester 1 deliverables  
Version: v2  
Date: [DD/MM/YYYY]

## 1. Purpose of this Document
This document captures the updated game design direction after early prototype pitching, team discussion, and feedback gathered during Semester 1. It explains what changed from the initial concept(s), why changes were made, and what the team is building toward in Semester 2.

## 2. Project Overview
### 2.1 Game Concept (Current Direction)
**Working Title:** Capture the Flag  
**Core Idea:** A team-based competitive experience where players attempt to capture an objective while preventing the opposing team from doing the same.  
**Primary Goal:** Create a fun, replayable competitive experience with clear scoring and quick-to-understand rules.

### 2.2 Target Audience and Design Goals
- Clear rules and simple onboarding
- Short, replayable rounds
- Competitive feedback loops (score/leaderboard)
- Visual consistency (pixel/retro-inspired UI)

## 3. Chronology: Prototype Pitch → Consolidated Design
During the early stage of Semester 1, each group member developed and presented an individual prototype. After reviewing all four, the group selected one prototype as the primary foundation and integrated “best parts” from each concept into a unified direction.  
This v2 proposal reflects that consolidation and clarifies the agreed gameplay loop and UI direction.

## 4. Changes from v1 (What Was Updated and Why)
### 4.1 Simplified Core Gameplay Loop
**Problem identified:** Early feedback and testing suggested the original loop risked being too complex (too many rules/interactions at once).  
**Change made:** Core loop was simplified to focus on:
- clear objective (capture/defend)
- readable scoring
- fewer mechanics at once, with room to expand later

### 4.2 UI/UX Improvements
**Goal:** Improve clarity, reduce cognitive load, and ensure players understand what to do immediately.  
Updates include:
- clearer team identification (Team A / Team B)
- leaderboard placement and readability prioritised
- consistent typography and pixel-art styling
- stronger visual hierarchy (title → teams → leaderboard)

### 4.3 Feasibility and Implementation Notes
Design decisions were adjusted to avoid mechanics that are difficult to implement reliably within the sprint scope. This ensures development can progress smoothly in Semester 2 without redesigning major features late.

## 5. Core Gameplay Loop (v2)
1. Player joins a team (Team A / Team B)  
2. Round begins with objective visible / known  
3. Players attempt to capture the objective  
4. Score updates immediately on success  
5. Leaderboard updates based on score  
6. Round ends on timer or score condition  
7. Players return to lobby / next round

## 6. Mechanics and Systems (v2)
### 6.1 Scoring
- Capturing the objective grants points
- Optional: bonus points for defense or assists (only if feasible)

### 6.2 Leaderboard
- Displays ranked players or team contributions
- Purpose: reinforce replayability and competition
- Must remain readable and consistent with pixel UI style

### 6.3 Win Conditions (Initial)
- First team to reach a target score OR
- Highest score when timer ends

## 7. User Interface Concept (v2)
### 7.1 Main Screen / Lobby Elements
- Game title and mode
- Team selection panels (Team A / Team B)
- Leaderboard panel

### 7.2 Visual Style
- Pixel-art inspired UI elements
- Clear contrast between teams
- Minimal clutter; readable text sizes

## 8. Testing and Iteration (Semester 1 Evidence)
Key iteration driver in Semester 1 was early testing/feedback that highlighted complexity and clarity issues.  
This proposal captures the refined direction resulting from:
- prototype review and consolidation
- playtest observations
- feasibility checks (design ↔ development alignment)

## 9. Semester 2 Development Focus (Design-to-Build Plan)
Planned next steps:
- Convert the agreed loop into a stable playable build
- Implement scoring + leaderboard updates
- Add small improvements based on structured playtesting
- Expand mechanics only after the base loop is stable

## 10. Appendices / References
- initial prototype screenshots/videos: UI-Design/Pixelion.mp4, UI-Design/Pixelion.png
- client sign-off document (Rory Hopcraft): Game documents/Client sign off document.pdf
- Playtest notes: UI-Design/playtest-notes-sem1.md
