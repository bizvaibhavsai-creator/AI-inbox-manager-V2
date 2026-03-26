"""Seed the database with demo data for dashboard preview."""

import random
from datetime import datetime, timedelta

from database import create_db_and_tables, get_session
from models import Campaign, FollowUp, Reply

# --- Demo campaigns ---
CAMPAIGNS = [
    ("camp_001", "SaaS Founders — Q1 Outreach"),
    ("camp_002", "E-commerce Directors — Cold Email"),
    ("camp_003", "Series A Startups — Growth Offer"),
    ("camp_004", "Agency Owners — White Label"),
    ("camp_005", "HR Leaders — Hiring Platform"),
]

CATEGORIES = ["interested", "not_interested", "ooo", "unsubscribe", "info_request", "wrong_person", "dnc"]
CATEGORY_WEIGHTS = [20, 30, 12, 6, 18, 8, 6]  # realistic distribution

FIRST_NAMES = ["Sarah", "James", "Priya", "Michael", "Emma", "Carlos", "Aisha", "David", "Lisa", "Tom",
               "Rachel", "Kevin", "Natasha", "Brian", "Olivia", "Raj", "Sophie", "Marcus", "Diana", "Alex",
               "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Quinn", "Avery", "Drew", "Blake", "Sam"]

LAST_NAMES = ["Chen", "Patel", "O'Brien", "Williams", "Garcia", "Kim", "Singh", "Johnson", "Martinez", "Lee",
              "Thompson", "Robinson", "Clark", "Lewis", "Walker", "Hall", "Young", "Allen", "King", "Wright"]

COMPANIES = ["NovaTech Inc", "Acme Corp", "Velocity Labs", "GrowthStack", "CloudFirst",
             "Beacon Digital", "ScaleUp AI", "PivotPoint", "DataForge", "Launchpad HQ",
             "BrightPath", "Synapse Media", "Ironclad Systems", "Nexus Group", "Elevate SaaS",
             "ClearView Analytics", "Momentum Co", "Apex Solutions", "FreshWorks", "TrueNorth"]

SUBJECTS = [
    "Re: Streamlining Your Sales Operations",
    "Re: Reducing Churn for SaaS Companies",
    "Re: Automating Your Reporting Workflow",
    "Re: Growth Marketing Platform",
    "Re: Improving Your Customer Onboarding",
    "Re: Scale Your Outbound in Q1",
    "Re: Quick question about your hiring process",
    "Re: Partnership opportunity",
]

REPLY_BODIES = {
    "interested": [
        "This looks really interesting! We've been struggling with exactly this. Can we hop on a call this week?",
        "Thanks for reaching out. I'd love to learn more about how this works. Do you have time Thursday?",
        "Great timing — we're actually evaluating solutions in this space right now. Let's chat.",
        "I showed this to my team and they're keen. Can you walk us through a demo?",
        "This resonates with what we're trying to solve. What does the onboarding process look like?",
    ],
    "not_interested": [
        "Thanks for reaching out, but we're not looking to make any changes right now.",
        "Appreciate the note, but this isn't a fit for us at the moment.",
        "We're happy with our current setup. Good luck though!",
        "Not interested, but thanks for thinking of us.",
        "We just signed a 2-year contract with another vendor. Maybe next time.",
    ],
    "ooo": [
        "Hi, I'm currently out of the office and will return on March 15th. I'll get back to you then.",
        "Thanks for your email. I'm on PTO until next Monday. Will respond when I'm back.",
        "Auto-reply: I am out of the office with limited access to email. Back April 1st.",
    ],
    "unsubscribe": [
        "Please remove me from your mailing list.",
        "Unsubscribe",
        "Stop emailing me please.",
    ],
    "info_request": [
        "Interesting. Can you send over a case study or some more details about pricing?",
        "How does this integrate with Salesforce? We're pretty locked into their ecosystem.",
        "What kind of ROI have your clients seen? We'd need to build a business case internally.",
        "Do you have a free trial? I'd like to test it before committing to a call.",
        "Can you share some references from companies in our industry?",
    ],
    "wrong_person": [
        "I think you have the wrong person. I'm no longer at this company.",
        "This isn't my department. You'd want to reach out to our VP of Marketing.",
        "I left this role 6 months ago. Try reaching out to my replacement, Jason.",
    ],
    "dnc": [
        "Do not contact me again. I'm reporting this as spam.",
        "Remove me permanently. I never signed up for this.",
    ],
}

DRAFT_RESPONSES = {
    "interested": [
        "Hi {name},\n\nThanks so much for getting back to me — great to hear this resonates!\n\nI'd love to walk you through how we've helped companies like {company} tackle exactly this. How does Thursday at 2pm work for a quick 20-minute call?\n\nHere's my calendar link if that's easier: [CALENDAR LINK]\n\nLooking forward to it!",
        "Hi {name},\n\nReally glad this caught your eye! Based on what you mentioned, I think there's a strong fit here.\n\nLet's find 20 minutes this week — I'll share some specifics on how we've helped teams in your space. Would Wed or Thu afternoon work?\n\nBest,",
    ],
    "not_interested": [
        "Hi {name},\n\nCompletely understand — timing is everything with this kind of thing.\n\nI'll make sure you're off my follow-up list. But if anything changes down the road, feel free to reply here anytime.\n\nWishing you and the team a great quarter!",
    ],
    "info_request": [
        "Hi {name},\n\nGreat question! I've attached a case study from a company similar to {company} that saw a 3x improvement in their first quarter.\n\nFor pricing, most teams in your range land between $500-$1,500/month depending on usage. Happy to get more specific on a quick call — would 15 minutes work this week?",
        "Hi {name},\n\nAbsolutely — here's a quick overview:\n\n• We integrate natively with Salesforce, HubSpot, and Pipedrive\n• Average onboarding takes 2 weeks\n• Most clients see ROI within 60 days\n\nWant me to set up a personalized demo so you can see it in action with your data?",
    ],
}


def seed():
    create_db_and_tables()

    with get_session() as session:
        # Check if already seeded
        existing = session.query(Campaign).first()
        if existing:
            print("Database already has data. Skipping seed.")
            return

        now = datetime.utcnow()
        campaigns = []

        # Create campaigns
        for camp_id, camp_name in CAMPAIGNS:
            campaign = Campaign(
                plusvibe_camp_id=camp_id,
                name=camp_name,
                status="active",
                created_at=now - timedelta(days=random.randint(15, 60)),
                updated_at=now,
            )
            session.add(campaign)
            session.flush()
            campaigns.append(campaign)

        # Create replies spread over the last 30 days
        all_replies = []
        for i in range(187):  # ~187 total replies
            campaign = random.choice(campaigns)
            category = random.choices(CATEGORIES, weights=CATEGORY_WEIGHTS, k=1)[0]
            first = random.choice(FIRST_NAMES)
            last = random.choice(LAST_NAMES)
            company = random.choice(COMPANIES)
            days_ago = random.randint(0, 29)
            hours_ago = random.randint(0, 23)
            created = now - timedelta(days=days_ago, hours=hours_ago)

            body = random.choice(REPLY_BODIES[category])
            subject = random.choice(SUBJECTS)

            # Determine status
            if category in ("ooo", "unsubscribe", "dnc", "wrong_person"):
                status = "auto_handled"
                ai_draft = None
            elif category in ("interested", "info_request", "not_interested"):
                status = random.choices(
                    ["pending_approval", "sent", "rejected"],
                    weights=[20, 65, 15],
                    k=1,
                )[0]
                templates = DRAFT_RESPONSES.get(category, DRAFT_RESPONSES["interested"])
                ai_draft = random.choice(templates).format(name=first, company=company)
            else:
                status = "pending_approval"
                ai_draft = None

            sent_at = None
            if status == "sent":
                sent_at = created + timedelta(hours=random.uniform(0.5, 8))

            reply = Reply(
                campaign_id=campaign.id,
                plusvibe_camp_id=campaign.plusvibe_camp_id,
                lead_email=f"{first.lower()}.{last.lower()}@{company.lower().replace(' ', '')}.com",
                lead_name=f"{first} {last}",
                lead_company=company,
                subject=subject,
                body=body,
                category=category,
                ai_draft=ai_draft,
                status=status,
                plusvibe_reply_to_id=f"pv_msg_{random.randint(10000, 99999)}",
                from_email=f"outreach@plusvibe-demo.com",
                sentiment=random.choice(["POSITIVE", "NEGATIVE", "NEUTRAL"]),
                webhook_event="ALL_EMAIL_REPLIES",
                created_at=created,
                sent_at=sent_at,
                updated_at=created,
            )
            session.add(reply)
            session.flush()
            all_replies.append(reply)

            # Create follow-ups for interested/info_request
            if category in ("interested", "info_request") and status == "sent":
                for day in (3, 5, 7):
                    fu_status = random.choices(["sent", "pending", "skipped"], weights=[50, 30, 20], k=1)[0]
                    fu = FollowUp(
                        reply_id=reply.id,
                        day_number=day,
                        message=f"Follow-up day {day} for {first}",
                        status=fu_status,
                        scheduled_for=created + timedelta(days=day),
                        sent_at=(created + timedelta(days=day, hours=2)) if fu_status == "sent" else None,
                        created_at=created,
                    )
                    session.add(fu)

        session.commit()
        print(f"Seeded {len(campaigns)} campaigns, {len(all_replies)} replies with follow-ups.")


if __name__ == "__main__":
    seed()
