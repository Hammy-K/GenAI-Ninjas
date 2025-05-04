# App Builder Stream - Product Specification

## 🚀 Product Overview

The App Builder Stream is a guided, student-centered learning journey that enables high school students in Saudi Arabia to ideate, design, build, test, and publish their own GenAI-powered apps. The experience is built around a continuously evolving live document, supported by a contextual AI mentor named Dr. Pengy. The goal is to create a seamless, motivating, and empowering creative experience that builds real-world skills and confidence.

## 🔍 Core Objectives

- Empower students to become confident, creative, AI-native problem solvers
- Enable students to build real things with their own hands and ideas
- Guide students through a real-world creative cycle: idea → MVP → build → launch → iterate
- Ensure every step feels meaningful, emotionally engaging, and connected

## 🌎 Experience Structure

### Overall Flow

- Journey broken into 11 sequential steps
- Each step includes:
  - Micro content (videos/text)
  - Interactive task
  - Submission block
- Steps auto-unlock only after submission
- Students work at their own pace, with the ability to pause and resume

### Persistent Live Document

- Every submission, decision, and AI exchange is saved in one scrollable document
- Reflects the student's full thinking and building journey
- Used for sharing, reviewing, and continuous improvement

### Continuous AI Support

- Dr. Pengy chat always available (fixed 30% panel)
- Context-aware and retains access to:
  - Step the student is on
  - All previous submissions
  - Key content from each step
- Responds with nudges, questions, examples, small flavor facts, but never gives full answers

## ⚖️ Design Principles

### 1. Narrative Flow, Not Static Checklist

- Transitions feel like a story unfolding
- Step prompts reference prior work: "Now that you've defined your MVP..."
- Micro-milestones feel earned

### 2. Visual Journey Tracker

- Replaces static checklist with a map/timeline
- Visualizes journey, progress, and unlocked steps
- Badges earned upon submission

### 3. Step Auto-Unlock & Inline Expansion

- Steps load dynamically (no full-page transitions)
- Submissions unlock the next step instantly with animation + micro celebration (confetti, badge)

### 4. Recap Panel at Each Step

- Start of every step shows:
  - Problem statement
  - Last submission summary
  - Prototype link (if exists)
- Dr. Pengy references these in chat

### 5. Embedded Micro-Actions

- Emojis or quick reactions: "That was fun!", "Got stuck here"
- Encourages emotional awareness & engagement

### 6. Low-Friction Support Pathways

- Always something to do if stuck: ask Dr. Pengy, review prior work, or preview next step

### 7. Evolving Interface Aesthetics

- UI subtly shifts color/energy as user progresses
- Badges accumulate visually
- Final launch step triggers a celebration screen

## 🎓 Learning Flow (Condensed)

1. Identify a Problem
2. Explain Why It Matters to You
3. Use GenAI to Think Through the Problem
4. Research Similar Solutions
5. Define Your MVP
6. Build a Quick Prototype
7. Test & Improve
8. Publish & Pitch
9. Share with Real Users
10. Reflect on the Journey
11. Iterate & Relaunch

Each step includes:
- Rich content block (explanatory text, visuals, or video)
- Submission block (text, links, files)
- Optional Dr. Pengy quick prompts: "Give me an example", "Help me simplify this"

## 🔧 Backend & System Notes

- All student submissions stored under their UID
- Each submission is tied to a step and versioned
- AI context pulled from:
  - All student submissions
  - Previous chats with Pengy
  - Summary of user profile + current step
- Dr. Pengy has system-level access to fetch recent student work & summarize

## 🙌 Final Note

This isn't just a course. It's a creative studio powered by GenAI, where students feel in control, supported, and proud of what they make. Every step reinforces that they can shape the world—not just study it.

This is how we make future-ready education feel real.