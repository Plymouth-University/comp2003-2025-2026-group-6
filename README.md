## Capture the Flag: Educational Multiplayer Platform ##
# Project Overview #
This repository contains the source code and documentation for "Capture the Flag," a multiplayer educational software project developed for the COMP2003 module. The project was commissioned by outreach coach Rory Hopcraft to engage students aged 14 to 16 in a competitive learning environment. The primary objective is to create a secure, web-based platform where student teams compete to capture flags by answering questions, helping them develop digital safety and problem-solving skills outside of traditional teaching methods.

# Proposed Solution and Core Mechanics #
The software splits students into two opposing groups, Team Red and Team Blue, who battle to earn the highest score across a series of rounds. To ensure the content remains relevant for various subjects and age groups, the platform utilizes an AI model to generate questions and answers based on prompts input by the educator. The system allows teachers to run controlled game rooms or open lobbies and is designed to scale from small groups to full-class sessions.

# Unity Game Development and Sabotage Mechanics #
As outlined in the software specifications, the project integrates Unity-based mini-games embedded directly into the HTML framework to provide high-fidelity interactive elements. These games are designed to appear after question sets are completed, offering players opportunities to earn buffs or apply penalties to the opposing team. A primary implementation of this mechanic is the Cyber Worm module currently under active development. This specific game directly addresses the proposal's requirement for "sabotage" gameplay by allowing players to toggle between a defensive data-collection state and an aggressive "Sabotage Mode." This logic allows the player to actively attack the opposing team's score, fulfilling the project's goal of adding unpredictability and strategic advantages to the standard quiz format.

# Technical Architecture and Deployment Plan #
The application is built on a web service framework designed to support classroom activity. The project is currently in the local prototyping phase. Once the initial build is stable, the deployment roadmap involves hosting the service within the University of Plymouth domain for internal testing, with a final goal of hosting via AWS for broader implementation. The frontend is constructed using HTML to manage the user interface, including the question builders and scoreboards, while Unity is utilized for the physics-based mini-game components.

# Work Breakdown and Implementation Strategy #
The development workload is distributed among the group members, covering UI design, data management, structure development, and game creation. The games development phase involves brainstorming replayable concepts, creating base objects in Unity, and refining gameplay values to ensure a fair competitive balance. The project follows a timeline targeting a basic working build by February 2026, with subsequent updates scheduled for AI integration, host functionality, and full user account management.


[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xGnTrW1S)
[![Open in Codespaces](https://classroom.github.com/assets/launch-codespace-2972f46106e565e64193e422d61a12cf1da4916b45550586e14ef0a7c637dd04.svg)](https://classroom.github.com/open-in-codespaces?assignment_repo_id=21438146)
# COMP2003-2023
Use this folder structure for your git repository. You may add additional folders as you see fit, but these basic folders provide the fundamental organization for evidences that need to be collected throughout the semester, so upload/commit them periodically.
