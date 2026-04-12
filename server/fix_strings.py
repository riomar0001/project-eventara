#!/usr/bin/env python3
"""Fix string forward references in model files."""

# Fix user_models.py
with open("app/infrastructure/database/models/user_models.py") as f:
    content = f.read()

content = content.replace(
    'ratings: Mapped[list[VenueRating]] = relationship(back_populates="user", foreign_keys="VenueRating.user_id")',
    'ratings: Mapped[list["VenueRating"]] = relationship(back_populates="user", foreign_keys="VenueRating.user_id")',
)

with open("app/infrastructure/database/models/user_models.py", "w") as f:
    f.write(content)
print("✅ Fixed user_models.py")

# Fix venue_models.py
with open("app/infrastructure/database/models/venue_models.py") as f:
    content = f.read()

content = content.replace(
    'ratings: Mapped[list[VenueRating]] = relationship(back_populates="venue", foreign_keys="VenueRating.venue_id")',
    'ratings: Mapped[list["VenueRating"]] = relationship(back_populates="venue", foreign_keys="VenueRating.venue_id")',
)

with open("app/infrastructure/database/models/venue_models.py", "w") as f:
    f.write(content)
print("✅ Fixed venue_models.py")

# Fix venue_rating_models.py
with open("app/infrastructure/database/models/venue_rating_models.py") as f:
    content = f.read()

content = content.replace(
    'user: Mapped[User] = relationship(back_populates="ratings", foreign_keys=[user_id])',
    'user: Mapped["User"] = relationship(back_populates="ratings", foreign_keys=[user_id])',
)

content = content.replace(
    'venue: Mapped[Venue] = relationship(back_populates="ratings", foreign_keys=[venue_id])',
    'venue: Mapped["Venue"] = relationship(back_populates="ratings", foreign_keys=[venue_id])',
)

with open("app/infrastructure/database/models/venue_rating_models.py", "w") as f:
    f.write(content)
print("✅ Fixed venue_rating_models.py")

print("\n✅ All files updated successfully")
