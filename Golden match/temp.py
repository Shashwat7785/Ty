from app import app, db, User

with app.app_context():
    users = User.query.all()
    print(f"Total users in DB: {len(users)}")
    for u in users:
        print(f"Email: {u.email} | Hash Starts With: {u.password_hash[:15] if u.password_hash else 'NONE'}")