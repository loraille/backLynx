const request = require("supertest");
const app = require("./app");

describe("GET /categories", () => {
  it("should return a list of categories with specific categories present", async () => {
    const res = await request(app).get("/categories");

    expect(res.statusCode).toBe(200);
    expect(res.body.categories).toBeDefined();
    expect(Array.isArray(res.body.categories)).toBe(true);

    const expectedCategories = [
      "Trashart",
      "Gif",
      "Digital art",
      "3D",
      "WIP",
      "Music",
      "Physical art",
      "Ai",
      "Photography",
      "Mixed Media",
      "Sculpture",
    ];

    const receivedCategories = res.body.categories.map(
      (category) => category.name
    );

    // Verify that each expected category is present
    expectedCategories.forEach((category) => {
      expect(receivedCategories).toContain(category);
    });

    // Identify extra categories
    const extraCategories = receivedCategories.filter(
      (category) => !expectedCategories.includes(category)
    );
    if (extraCategories.length > 0) {
      const errorMessage = `Extra categories found: ${extraCategories.join(
        ", "
      )}. Expected length: ${expectedCategories.length}, Received length: ${
        receivedCategories.length
      }`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Verify that the response does not contain additional categories
    expect(receivedCategories.length).toBe(expectedCategories.length);
  });
});
