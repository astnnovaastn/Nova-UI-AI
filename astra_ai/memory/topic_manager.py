"""
Topic Manager for the AI chatbot.
Handles conversation topics, context tracking, and follow-up generation.
Enhanced for better context understanding and conversation flow.
"""

import os
import random
import re
import sys
import time
from typing import Set, Optional, List, Dict, Any, Tuple

# Add project root to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

class TopicManager:
    """Manages conversation topics, context tracking, and follow-up generation."""

    def __init__(self):
        """Initialize the topic manager with default topics and tracking."""
        self.current_topics = set()
        self.potential_topics = set([
            "technology", "movies", "music", "books", "travel", 
            "food", "sports", "hobbies", "news", "weather",
            "pets", "art", "science", "games", "fitness", "education",
            "work", "family", "friends", "health", "entertainment",
            "fashion", "history", "politics", "environment", "psychology"
        ])
        self.topic_history = []
        self.last_topic_switch = time.time()
        self.context_memory = {}
        self.questions_asked = 0
        self.max_follow_ups = 3
        
        # Enhanced topic tracking
        self.topic_engagement = {}  # Track user engagement with topics
        self.conversation_flow = []  # Track conversation flow
        self.topic_keywords = self._initialize_topic_keywords()
        self.conversation_state = "greeting"  # Track conversation state
        
        # Context understanding
        self.entities_mentioned = set()
        self.user_sentiment = {}  # Track sentiment toward topics
        self.conversation_depth = {}  # Track depth of conversation on topics
        
    def _initialize_topic_keywords(self) -> Dict[str, List[str]]:
        """Initialize comprehensive topic keywords for better detection."""
        return {
            "technology": ["tech", "computer", "digital", "software", "app", "phone", "device", 
                          "internet", "online", "website", "code", "programming", "ai", "robot", 
                          "smart", "electronic", "gadget", "virtual", "cyber"],
            
            "movies": ["movie", "film", "cinema", "watch", "actor", "actress", "director", "scene", 
                      "character", "plot", "theater", "hollywood", "series", "show", "drama", 
                      "comedy", "action", "thriller", "sci-fi", "documentary"],
            
            "music": ["music", "song", "artist", "band", "album", "concert", "playlist", "genre", 
                     "listen", "singer", "musician", "melody", "rhythm", "lyrics", "instrument", 
                     "tune", "beat", "rock", "pop", "jazz", "classical", "rap", "hip-hop"],
            
            "books": ["book", "read", "author", "novel", "story", "chapter", "character", "plot", 
                     "literature", "fiction", "non-fiction", "genre", "series", "publish", 
                     "library", "ebook", "audiobook", "bestseller", "writer"],
            
            "travel": ["travel", "trip", "vacation", "visit", "country", "city", "place", "tour", 
                      "destination", "journey", "adventure", "explore", "tourist", "flight", 
                      "hotel", "abroad", "foreign", "passport", "sightseeing"],
            
            "food": ["food", "eat", "meal", "restaurant", "cook", "recipe", "dish", "taste", 
                    "flavor", "cuisine", "ingredient", "breakfast", "lunch", "dinner", "snack", 
                    "dessert", "drink", "beverage", "diet", "chef", "bake"],
            
            "sports": ["sport", "game", "team", "player", "match", "competition", "win", "lose", 
                      "score", "play", "athlete", "coach", "tournament", "championship", "league", 
                      "fan", "stadium", "fitness", "exercise", "workout"],
            
            "hobbies": ["hobby", "interest", "activity", "free time", "pastime", "collect", 
                       "craft", "build", "create", "make", "draw", "paint", "photography", 
                       "garden", "sew", "knit", "woodwork", "model", "puzzle"],
            
            "news": ["news", "current events", "headline", "report", "journalist", "media", 
                    "press", "broadcast", "article", "story", "update", "information", 
                    "announcement", "development", "situation", "coverage"],
            
            "weather": ["weather", "temperature", "forecast", "climate", "rain", "snow", "sun", 
                       "wind", "storm", "cold", "hot", "warm", "humid", "dry", "season", 
                       "spring", "summer", "fall", "autumn", "winter"],
            
            "pets": ["pet", "animal", "dog", "cat", "bird", "fish", "hamster", "rabbit", 
                    "reptile", "adopt", "rescue", "breed", "veterinarian", "vet", "care", 
                    "feed", "walk", "train", "companion"],
            
            "work": ["job", "career", "work", "office", "business", "company", "profession", 
                    "employment", "boss", "colleague", "coworker", "project", "task", "meeting", 
                    "interview", "salary", "promotion", "resume", "workplace"],
            
            "family": ["family", "parent", "child", "kid", "mom", "dad", "mother", "father", 
                      "brother", "sister", "sibling", "grandparent", "grandchild", "aunt", 
                      "uncle", "cousin", "relative", "relationship", "home"],
            
            "health": ["health", "medical", "doctor", "hospital", "illness", "disease", "symptom", 
                      "treatment", "medicine", "drug", "therapy", "mental", "physical", "diet", 
                      "exercise", "wellness", "stress", "sleep", "healthy"],
            
            "education": ["education", "school", "college", "university", "student", "teacher", 
                         "professor", "class", "course", "degree", "learn", "study", "knowledge", 
                         "academic", "subject", "grade", "exam", "test", "homework"],
            
            "general": ["thing", "stuff", "idea", "thought", "opinion", "view", "feeling", 
                       "experience", "situation", "issue", "matter", "topic", "subject", 
                       "question", "answer", "problem", "solution", "way", "time", "day"]
        }

    def extract_topics(self, message: str) -> Set[str]:
        """Extract potential topics from a message with improved detection."""
        message_lower = message.lower()
        detected_topics = set()
        
        # Check each topic's keywords
        for topic, keywords in self.topic_keywords.items():
            # Count how many keywords match
            matches = sum(1 for keyword in keywords if keyword in message_lower)
            
            # If multiple keywords match or a single strong keyword match
            if matches >= 2 or any(f" {keyword} " in f" {message_lower} " for keyword in keywords):
                detected_topics.add(topic)
                
                # Track entities mentioned
                for keyword in keywords:
                    if keyword in message_lower and len(keyword) > 3:  # Only meaningful keywords
                        self.entities_mentioned.add(keyword)
        
        # Extract named entities (simple approach)
        # Look for capitalized words that might be names, places, etc.
        potential_entities = re.findall(r'\b[A-Z][a-z]+\b', message)
        for entity in potential_entities:
            if len(entity) > 1:  # Avoid single letters
                self.entities_mentioned.add(entity.lower())
                
        return detected_topics

    def analyze_sentiment(self, message: str) -> Dict[str, float]:
        """Analyze sentiment toward topics in the message.
        
        Args:
            message: The user's message
            
        Returns:
            Dictionary mapping topics to sentiment scores (-1 to 1)
        """
        message_lower = message.lower()
        sentiment_results = {}
        
        # Simple sentiment analysis based on keywords
        positive_words = ["like", "love", "enjoy", "great", "good", "excellent", "amazing", 
                         "wonderful", "fantastic", "awesome", "favorite", "best", "happy", 
                         "interested", "exciting", "fun", "nice", "cool"]
        
        negative_words = ["dislike", "hate", "boring", "bad", "terrible", "awful", "worst", 
                         "annoying", "frustrating", "disappointing", "waste", "stupid", 
                         "useless", "difficult", "hard", "confusing", "sad", "angry"]
        
        # Check sentiment for each detected topic
        for topic in self.current_topics:
            if topic in message_lower:
                # Calculate sentiment score
                pos_count = sum(1 for word in positive_words if word in message_lower)
                neg_count = sum(1 for word in negative_words if word in message_lower)
                
                if pos_count > 0 or neg_count > 0:
                    total = pos_count + neg_count
                    sentiment_score = (pos_count - neg_count) / total
                    sentiment_results[topic] = sentiment_score
                    
                    # Update overall sentiment for this topic
                    if topic not in self.user_sentiment:
                        self.user_sentiment[topic] = sentiment_score
                    else:
                        # Moving average of sentiment
                        self.user_sentiment[topic] = 0.7 * self.user_sentiment[topic] + 0.3 * sentiment_score
        
        return sentiment_results

    def update_topics(self, message: str) -> None:
        """Update current topics based on user message with improved tracking."""
        # Extract topics
        new_topics = self.extract_topics(message)
        
        # Analyze sentiment
        sentiment = self.analyze_sentiment(message)
        
        # Update conversation flow
        self.conversation_flow.append({
            "message": message,
            "topics": list(new_topics),
            "sentiment": sentiment,
            "timestamp": time.time()
        })
        
        # Update current topics
        if new_topics:
            self.current_topics.update(new_topics)
            self.topic_history.extend(list(new_topics))
            
            # Update topic engagement
            for topic in new_topics:
                if topic not in self.topic_engagement:
                    self.topic_engagement[topic] = 1
                else:
                    self.topic_engagement[topic] += 1
                    
                # Update conversation depth
                if topic not in self.conversation_depth:
                    self.conversation_depth[topic] = 1
                else:
                    self.conversation_depth[topic] += 1
        
        # Limit current topics to most engaged ones
        if len(self.current_topics) > 3:
            # Sort topics by engagement level
            sorted_topics = sorted(
                self.current_topics, 
                key=lambda t: self.topic_engagement.get(t, 0), 
                reverse=True
            )
            self.current_topics = set(sorted_topics[:3])
        
        # Update conversation state
        self._update_conversation_state(message)

    def _update_conversation_state(self, message: str) -> None:
        """Update the conversation state based on the message content and flow.
        
        Args:
            message: The user's message
        """
        message_lower = message.lower()
        
        # Check for greetings
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "what's up"]
        if any(greeting in message_lower for greeting in greetings) and len(message_lower) < 20:
            self.conversation_state = "greeting"
            return
            
        # Check for farewells
        farewells = ["bye", "goodbye", "see you", "talk to you later", "have to go", "leaving"]
        if any(farewell in message_lower for farewell in farewells):
            self.conversation_state = "farewell"
            return
            
        # Check for questions
        if "?" in message or any(q in message_lower for q in ["what", "how", "why", "when", "where", "who", "can you", "could you"]):
            self.conversation_state = "question"
            return
            
        # Check for deep conversation
        deep_indicators = ["think", "feel", "believe", "opinion", "perspective", "view", "meaning", "purpose", "life", "death", "philosophy"]
        if any(indicator in message_lower for indicator in deep_indicators):
            self.conversation_state = "deep"
            return
            
        # Check for emotional content
        emotional_words = ["happy", "sad", "angry", "frustrated", "excited", "worried", "anxious", "scared", "love", "hate", "afraid"]
        if any(word in message_lower for word in emotional_words):
            self.conversation_state = "emotional"
            return
            
        # Default to casual conversation
        self.conversation_state = "casual"

    def should_change_topic(self) -> bool:
        """Determine if it's appropriate to change the topic with improved logic."""
        # Check time since last topic switch
        time_since_last_switch = time.time() - self.last_topic_switch
        if time_since_last_switch < 300:  # 5 minutes
            return False
            
        # Check conversation depth on current topics
        for topic in self.current_topics:
            # If we're having a deep conversation on any current topic, don't change
            if self.conversation_depth.get(topic, 0) >= 3:
                return False
                
        # Check conversation state
        if self.conversation_state in ["greeting", "farewell", "emotional"]:
            return False
            
        # Base chance on conversation flow
        if len(self.conversation_flow) >= 5:
            # If the last few exchanges have been on the same topics, higher chance to change
            recent_topics = set()
            for exchange in self.conversation_flow[-3:]:
                recent_topics.update(exchange["topics"])
                
            if len(recent_topics) <= 1:
                return random.random() < 0.30  # 30% chance if conversation is stagnating
        
        # Default chance
        return random.random() < 0.15  # 15% chance

    def suggest_new_topic(self) -> Optional[str]:
        """Suggest a new topic to discuss with improved selection."""
        if not self.should_change_topic():
            return None
            
        # Prioritize topics the user has shown positive sentiment toward
        positive_topics = [
            topic for topic, score in self.user_sentiment.items() 
            if score > 0.3 and topic not in self.current_topics
        ]
        
        # If we have positive topics, prioritize those
        if positive_topics and random.random() < 0.7:  # 70% chance to use positive topics
            new_topic = random.choice(positive_topics)
        else:
            # Otherwise, choose from available topics
            available_topics = self.potential_topics - self.current_topics
            if not available_topics:
                available_topics = self.potential_topics
            if not available_topics:
                return None
                
            new_topic = random.choice(list(available_topics))
        
        self.last_topic_switch = time.time()
        self.current_topics.add(new_topic)
        return new_topic

    def generate_follow_up(self, message: str, response: str, avoid_topics: List[str] = None) -> Optional[str]:
        """Generate a contextually relevant follow-up question based on the conversation.
        
        Args:
            message: The user's message
            response: The AI's response
            avoid_topics: List of topics to avoid asking about (user has already expressed interest)
            
        Returns:
            A follow-up question or None
        """
        # Initialize avoid_topics if None
        if avoid_topics is None:
            avoid_topics = []
            
        # Check if we've asked too many follow-ups already
        if self.questions_asked >= self.max_follow_ups:
            self.questions_asked = 0
            return None
            
        # Don't ask follow-up questions if the user's message is very short
        if len(message.strip()) < 5:
            return None
            
        # Increment question counter
        self.questions_asked += 1
        
        # Track previously asked questions to avoid repetition
        if not hasattr(self, 'previous_follow_ups'):
            self.previous_follow_ups = []
        
        # Get current topics, prioritizing those with higher engagement
        # Filter out topics to avoid (topics user has already expressed interest in)
        available_topics = [t for t in self.current_topics if t not in avoid_topics]
        
        # If we have no available topics after filtering, use general topics
        if not available_topics:
            # Try to find a topic the user hasn't discussed much
            all_potential = [t for t in self.potential_topics if t not in avoid_topics]
            if all_potential:
                available_topics = [random.choice(all_potential)]
            else:
                available_topics = ["general"]
        
        # Sort by engagement
        topics = sorted(
            list(available_topics), 
            key=lambda t: self.topic_engagement.get(t, 0), 
            reverse=True
        )
            
        # Select appropriate follow-up templates based on conversation state
        if self.conversation_state == "greeting":
            templates = [
                "How's your day going?",
                "What have you been up to?",
                "Anything interesting happening?",
                "What's on your mind today?"
            ]
            return random.choice(templates)
            
        elif self.conversation_state == "emotional":
            templates = [
                "How does that make you feel?",
                "Has that been on your mind a lot?",
                "What do you think about that?",
                "Is there anything specific about that bothering you?",
                "What would make you feel better about this?"
            ]
            return random.choice(templates)
            
        elif self.conversation_state == "deep":
            templates = [
                "That's an interesting perspective. Why do you think that?",
                "What led you to that conclusion?",
                "How long have you felt that way?",
                "Has your thinking on this evolved over time?",
                "What other aspects of this topic interest you?"
            ]
            return random.choice(templates)
            
        # Topic-specific follow-ups
        follow_up_templates = {
            "technology": [
                "What tech do you use most often?",
                "Have you tried any new apps recently?",
                "What's your take on AI like me?",
                "Any tech you're excited about?",
                "How do you feel technology has changed your life?",
                "What's one piece of technology you couldn't live without?"
            ],
            "movies": [
                "Seen any good movies lately?",
                "What's your favorite genre?",
                "Any directors or actors you particularly like?",
                "What was the last movie that really impressed you?",
                "Do you prefer watching at home or in theaters?",
                "Any upcoming releases you're looking forward to?"
            ],
            "music": [
                "What kind of music do you listen to most?",
                "Any favorite artists or bands?",
                "Do you play any instruments?",
                "Been to any good concerts recently?",
                "How do you usually discover new music?",
                "What song has been stuck in your head lately?"
            ],
            "books": [
                "Read anything interesting lately?",
                "Who are some of your favorite authors?",
                "Do you prefer fiction or non-fiction?",
                "What book has influenced you the most?",
                "Do you use e-readers or prefer physical books?",
                "Any books you're looking forward to reading?"
            ],
            "travel": [
                "Been anywhere interesting recently?",
                "What's your favorite place you've visited?",
                "Any dream destinations?",
                "Do you prefer relaxing vacations or adventures?",
                "What's the most memorable trip you've taken?",
                "Any travel plans coming up?"
            ],
            "food": [
                "What's your favorite type of cuisine?",
                "Do you enjoy cooking?",
                "Tried any new restaurants lately?",
                "What's your go-to comfort food?",
                "Any foods you absolutely won't eat?",
                "What's the best meal you've had recently?"
            ],
            "work": [
                "How's work been going for you?",
                "What do you enjoy most about your job?",
                "Any interesting projects you're working on?",
                "What would be your ideal career?",
                "How do you maintain work-life balance?",
                "What's been challenging at work lately?"
            ],
            "family": [
                "How's your family doing?",
                "Any family traditions you particularly enjoy?",
                "What's your favorite way to spend time with family?",
                "Any fun family stories you'd like to share?",
                "Do you have any siblings?",
                "What values from your family have shaped you most?"
            ],
            "health": [
                "How have you been taking care of yourself lately?",
                "Any fitness activities you enjoy?",
                "What do you do to manage stress?",
                "How's your sleep been?",
                "Found any good wellness practices that work for you?",
                "What's one health goal you're working toward?"
            ],
            "general": [
                "What's been on your mind lately?",
                "Anything you're looking forward to?",
                "How's your week been going?",
                "What's something that made you smile recently?",
                "Any new interests or hobbies you've picked up?",
                "What's something you're proud of?"
            ]
        }
        
        # Choose a topic, prioritizing the most engaged one
        topic = topics[0] if topics else "general"
        
        # Get templates for the topic
        if topic in follow_up_templates:
            templates = follow_up_templates[topic]
        else:
            templates = follow_up_templates["general"]
            
        # Filter out previously asked questions to avoid repetition
        if hasattr(self, 'previous_follow_ups') and self.previous_follow_ups:
            fresh_templates = [t for t in templates if t not in self.previous_follow_ups]
            if fresh_templates:
                templates = fresh_templates
        
        # Choose a follow-up question
        follow_up = random.choice(templates)
        
        # Store this question to avoid repeating it
        if hasattr(self, 'previous_follow_ups'):
            self.previous_follow_ups.append(follow_up)
            # Keep only the last 10 follow-ups to avoid memory bloat
            self.previous_follow_ups = self.previous_follow_ups[-10:]
            
        return follow_up

    def store_context(self, key: str, value: str) -> None:
        """Store conversation context for later reference."""
        self.context_memory[key] = {
            "value": value,
            "timestamp": time.time(),
            "references": 0
        }

    def get_context(self, key: str) -> Optional[str]:
        """Retrieve stored conversation context with tracking."""
        if key in self.context_memory:
            # Increment reference count
            self.context_memory[key]["references"] += 1
            return self.context_memory[key]["value"]
        return None

    def should_ask_follow_up(self) -> bool:
        """Determine if the bot should ask a follow-up question with improved logic."""
        # Track how many follow-ups we've asked in a row
        if not hasattr(self, 'consecutive_follow_ups'):
            self.consecutive_follow_ups = 0
        
        # If we've asked too many follow-ups in a row, take a break
        if self.consecutive_follow_ups >= 2:
            self.consecutive_follow_ups = 0
            return False
            
        # Base chance on conversation state
        if self.conversation_state == "greeting":
            # Only 50% chance to ask follow-up after greeting
            should_ask = random.random() < 0.5
            
        elif self.conversation_state == "farewell":
            return False  # Never ask a follow-up during farewell
            
        elif self.conversation_state == "emotional":
            # Reduced chance for emotional topics
            should_ask = random.random() < 0.4
            
        elif self.conversation_state == "question":
            # If the user just asked a question, don't immediately ask another
            should_ask = random.random() < 0.2  # Only 20% chance
            
        elif self.conversation_state == "deep":
            # For deep conversations, be more selective
            should_ask = random.random() < 0.4  # 40% chance for deep topics
            
        else:
            # Default for casual conversation
            should_ask = random.random() < 0.3  # 30% chance
            
        # If we decided to ask a follow-up, increment the counter
        if should_ask:
            self.consecutive_follow_ups += 1
        else:
            # Reset the counter if we're not asking a follow-up
            self.consecutive_follow_ups = 0
            
        return should_ask
        
    def get_conversation_context(self) -> Dict[str, Any]:
        """Get the current conversation context for improved responses.
        
        Returns:
            Dictionary with conversation context information
        """
        return {
            "state": self.conversation_state,
            "current_topics": list(self.current_topics),
            "topic_engagement": self.topic_engagement,
            "entities_mentioned": list(self.entities_mentioned)[:10],
            "conversation_depth": self.conversation_depth,
            "user_sentiment": self.user_sentiment
        }
