from pydantic import BaseModel

class CategoryBase(BaseModel):
    name: str
    type: str | None = None
    status: str = "active"

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    status: str | None = None

class Category(CategoryBase):
    id: int

    class Config:
        from_attributes = True
