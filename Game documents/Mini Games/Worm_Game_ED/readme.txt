# Cyber Worm: Project Mini-Game #
"Cyber Worm" is a custom mini-game developed for our "Capture the Flag" educational platform. It acts as a fast-paced challenge where players navigate a server grid to collect data files. As part of our wider plan to include interactive elements, this game implements the Sabotage mechanic: instead of just earning points, successful runs allow players to attack the opposing team's score. I have fully built the core mechanics in Unity (C#), including the Game Loop, collision logic, and difficulty scaling, ensuring it meets the Accessible and Smooth requirements for school hardware. I have also exported the project to WebGL, which allows it to be embedded directly into the HTML structure of the website as specified in our software design.

# Current Features Implemented #
- Core Game Engine: Developed the full mini-game in Unity (C#) using 2D physics and collision detection logic.
- Sabotage Logic: Implemented a scoring system that tracks points and difficulty, designed to deduct values from the opposing team’s score.
- Dynamic Scaling: Created a difficulty algorithm that spawns additional "Firewall" obstacles automatically as the player’s score increases.
- Web Integration: Successfully converted the Unity project into a WebGL build, allowing the game to run natively inside a web browser.
- Optimization: Cleaned the hierarchy and code structure to ensure the game meets the "Smooth" requirement for lower-end school hardware (Intel i3 baseline).

# Next Development Phase #
- Features & Polish: Complete overhaul of the current "placeholder" aesthetic, including the addition of Audio (SFX for eating/crashing), visual particle effects, and extensive gameplay refinement to meet professional standards.
- Database Connection: Replace the current local scoring function with a live API connection to send data to the main SQL database.
- Cloud Deployment: Migrate the hosting environment from the local University server to AWS (Amazon Web Services) for final delivery.
- Security Protocol: Finalize the "Sandboxed" environment to ensure the game client cannot access restricted areas of the main server.
