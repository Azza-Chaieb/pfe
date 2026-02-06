## Guide d'utilisation de l'API Test

### Configuration des permissions

Pour permettre l'accès public à l'API:

1. Allez sur `http://localhost:1337/admin`
2. Allez dans **Settings** > **Users & Permissions Plugin** > **Roles**
3. Sélectionnez **Public**
4. Sous **Permissions**, trouvez **Test** et activez:
   - ✅ find
   - ✅ findOne
   - ✅ create
   - ✅ update
   - ✅ delete

### Exemples de requêtes

#### 1. Créer un test

```bash
curl -X POST http://localhost:1337/api/tests \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "Test1",
      "password": "SecurePassword123"
    }
  }'
```

#### 2. Récupérer tous les tests

```bash
curl -X GET http://localhost:1337/api/tests
```

#### 3. Récupérer un test spécifique

```bash
curl -X GET http://localhost:1337/api/tests/1
```

#### 4. Mettre à jour un test

```bash
curl -X PUT http://localhost:1337/api/tests/1 \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "name": "TestUpdated",
      "password": "NewSecurePassword123"
    }
  }'
```

#### 5. Supprimer un test

```bash
curl -X DELETE http://localhost:1337/api/tests/1
```

### Validations

- `name`: Requis, unique, 3-50 caractères
- `password`: Requis, au moins 8 caractères, privé (non affiché par défaut)

### Notes

- Le champ `password` est marqué comme privé et ne s'affiche que si vous avez les permissions appropriées
- Les validations sont appliquées au niveau du contrôleur et du schéma
