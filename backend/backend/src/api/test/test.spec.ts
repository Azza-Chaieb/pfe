/// <reference types="jest" />

describe("Test API Endpoints", () => {
  const BASE_URL = "http://localhost:1337/api";
  let testId: number;

  beforeAll(() => {
    console.log("🧪 Démarrage des tests...");
  });

  afterAll(() => {
    console.log("✅ Tests terminés");
  });

  it("POST /api/tests - Créer un test", async () => {
    const res = await fetch(`${BASE_URL}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: "TestUser1",
          password: "Password123",
        },
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    testId = data.data.id;
    expect(data.data.name).toBe("TestUser1");
  });

  it("GET /api/tests - Récupérer tous les tests", async () => {
    const res = await fetch(`${BASE_URL}/tests`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("GET /api/tests/:id - Récupérer un test", async () => {
    const res = await fetch(`${BASE_URL}/tests/${testId}`);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.data.name).toBe("TestUser1");
  });

  it("PUT /api/tests/:id - Mettre à jour un test", async () => {
    const res = await fetch(`${BASE_URL}/tests/${testId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: "TestUserUpdated",
          password: "UpdatedPassword123",
        },
      }),
    });

    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.data.name).toBe("TestUserUpdated");
  });

  it("DELETE /api/tests/:id - Supprimer un test", async () => {
    const res = await fetch(`${BASE_URL}/tests/${testId}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(200);
  });

  it("POST /api/tests - Validation: password requis", async () => {
    const res = await fetch(`${BASE_URL}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: "TestInvalid",
        },
      }),
    });

    expect(res.status).toBe(400);
  });

  it("POST /api/tests - Validation: password minimum 8 caractères", async () => {
    const res = await fetch(`${BASE_URL}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: {
          name: "TestInvalid2",
          password: "short",
        },
      }),
    });

    expect(res.status).toBe(400);
  });
});
