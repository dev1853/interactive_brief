# Code Citations

## License: MIT
https://github.com/ShvetsovYura/FastAPI_DI_SqlAlchemy/tree/18d21d195cebab2ddbb81a1c3d9cd233396e26a2/webapp/models.py

```
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column
```

