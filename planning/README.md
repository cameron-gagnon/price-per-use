# Price Per Use App - Planning Documentation

## Project Overview

This is a simple Android application for tracking the price-per-use of purchased items. Users can add items with their purchase price and date, then tap items to record usage, automatically calculating and displaying the current price per use.

## Key Requirements Met

✅ **Non-native Android app** (React Native, no Kotlin/Java)
✅ **Local storage only** (SQLite, no online database)
✅ **Simple CRUD operations** (Add, view, edit, delete items)
✅ **Usage tracking** (Tap to increment, track usage dates)
✅ **Price per use calculation** (Automatic calculation and display)
✅ **Historical data** (Purchase dates, usage dates stored but hidden by default)

## Recommended Tech Stack

**Primary Framework**: React Native with Expo
**Language**: TypeScript
**Database**: SQLite (via expo-sqlite)
**Navigation**: React Navigation v6
**UI Components**: React Native Paper or NativeBase
**State Management**: React Context + useReducer

## Planning Documents

1. **[tech-stack.md](./tech-stack.md)** - Detailed tech stack recommendation with alternatives
2. **[architecture.md](./architecture.md)** - Complete app architecture, data model, and component structure
3. **[development-roadmap.md](./development-roadmap.md)** - Phase-by-phase development plan

## Quick Start Summary

The app will have three main screens:
- **Home Screen**: List of items showing name and price-per-use, tap to increment usage
- **Add Item Screen**: Form to add new items (name, price, purchase date)
- **Item Detail Screen**: Detailed view with usage history and edit/delete options

Data is stored in two SQLite tables:
- `items` - Basic item information (name, price, purchase date)
- `usage_records` - Individual usage instances with timestamps

## Development Phases

1. **Setup & Infrastructure** (1-2 sessions)
2. **Core Functionality** (2-3 sessions)
3. **Enhanced Features** (2-3 sessions)
4. **Polish & UX** (1-2 sessions)
5. **Testing & Deployment** (1 session)

**Estimated Total**: 7-11 AI agent sessions

## Next Steps

When you're ready to begin development, we'll start with Phase 1:
1. Initialize the Expo project with TypeScript
2. Set up the project structure
3. Install dependencies
4. Create the database service

The planning documents provide comprehensive guidance for each phase of development.
