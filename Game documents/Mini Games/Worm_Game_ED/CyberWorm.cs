using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class CyberWorm : MonoBehaviour
{
    // --- SETTINGS ---
    [Header("Game Settings")]
    public float moveSpeed = 0.15f;
    public int borderSize = 12;
    public int growthAmount = 2;

    [Header("References")]
    public GameObject bodyPrefab;
    public GameObject foodPrefab;
    public GameObject obstaclePrefab;
    public GameObject wallPrefab;

    // UI Panels
    public GameObject gameOverPanel;
    public GameObject startMenuPanel;
    public Text scoreText;
    public Text modeText;

    [Header("Audio")]
    public AudioClip eatSound;
    public AudioClip crashSound;
    public AudioClip switchSound;

    // --- STATE ---
    private Vector2 _direction = Vector2.right;
    private Vector2 _lastMovedDir = Vector2.right;
    private List<Transform> _segments = new List<Transform>();

    // Game Flow Flags
    private bool _isAlive = true;
    private bool _isGameOver = false;
    private bool _inMenu = true;
    private bool _hasStartedMoving = false;

    // Folders for hierarchy organization
    private Transform wallFolder;
    private Transform bodyFolder;
    private Transform itemFolder;

    // CTF Logic
    private bool _isSabotageMode = false;
    private int _myScore = 0;
    private int _enemyScore = 150;

    // New Difficulty Logic
    private int _itemsCollected = 0; // Counts total files eaten

    private void Start()
    {
        // Pause time immediately
        Time.timeScale = 0;

        // Show Menu, Hide Game Over
        if (startMenuPanel != null) startMenuPanel.SetActive(true);
        if (gameOverPanel != null) gameOverPanel.SetActive(false);

        // Reset lists and add head
        _segments.Clear();
        _segments.Add(this.transform);
        transform.localScale = new Vector3(0.9f, 0.9f, 1f);

        // Create folders to clean up hierarchy
        wallFolder = new GameObject("--- WALLS ---").transform;
        bodyFolder = new GameObject("--- BODY ---").transform;
        itemFolder = new GameObject("--- ITEMS ---").transform;

        // Spawn initial items
        SpawnFood();
        SpawnObstacle();
        SpawnWalls();
        UpdateUI();
    }

    private void Update()
    {
        // 1. MENU PHASE
        if (_inMenu)
        {
            if (Input.GetKeyDown(KeyCode.R)) InitializeSystem();
            return;
        }

        // 2. GAME OVER PHASE
        if (_isGameOver)
        {
            if (Input.GetKeyDown(KeyCode.R))
            {
                Time.timeScale = 1;
                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            }
            return;
        }

        // 3. READY PHASE (Wait for WASD)
        if (!_hasStartedMoving)
        {
            if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) ||
                Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow) ||
                Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow) ||
                Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow))
            {
                _hasStartedMoving = true;
                InvokeRepeating(nameof(Move), moveSpeed, moveSpeed);
            }
        }

        // 4. INPUTS
        if ((Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow)) && _lastMovedDir != Vector2.down)
            _direction = Vector2.up;
        else if ((Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow)) && _lastMovedDir != Vector2.up)
            _direction = Vector2.down;
        else if ((Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow)) && _lastMovedDir != Vector2.right)
            _direction = Vector2.left;
        else if ((Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow)) && _lastMovedDir != Vector2.left)
            _direction = Vector2.right;

        // Mode Toggle
        if (Input.GetKeyDown(KeyCode.Space))
        {
            _isSabotageMode = !_isSabotageMode;
            if (switchSound != null) GetComponent<AudioSource>().PlayOneShot(switchSound);
            UpdateUI();
        }
    }

    public void InitializeSystem()
    {
        _inMenu = false;
        Time.timeScale = 1;
        if (startMenuPanel != null) startMenuPanel.SetActive(false);
        if (switchSound != null) GetComponent<AudioSource>().PlayOneShot(switchSound);
    }

    private void Move()
    {
        if (!_isAlive) return;

        // Move body parts
        for (int i = _segments.Count - 1; i > 0; i--)
        {
            _segments[i].position = _segments[i - 1].position;
        }

        // Move head
        float x = Mathf.Round(transform.position.x) + _direction.x;
        float y = Mathf.Round(transform.position.y) + _direction.y;
        transform.position = new Vector3(x, y, 0.0f);

        _lastMovedDir = _direction;

        // Check map boundaries
        if (Mathf.Abs(x) >= borderSize || Mathf.Abs(y) >= borderSize)
        {
            GameOver();
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        // Hit Self
        if (other.CompareTag("Player"))
        {
            if (_segments.Contains(other.transform))
            {
                if (other.transform == _segments[_segments.Count - 1]) return;
            }
            GameOver();
        }
        // Hit Obstacle
        else if (other.CompareTag("Obstacle"))
        {
            GameOver();
        }
        // Hit Food
        else if (other.CompareTag("Food"))
        {
            if (eatSound != null) GetComponent<AudioSource>().PlayOneShot(eatSound);

            for (int i = 0; i < growthAmount; i++) { Grow(); }

            Destroy(other.gameObject);

            // Increment total items collected
            _itemsCollected++;

            // Score Logic
            if (_isSabotageMode) _enemyScore -= 10;
            else _myScore += 10;

            // Difficulty Logic: Add Firewall every 5 items collected
            if (_itemsCollected > 0 && _itemsCollected % 5 == 0)
            {
                SpawnObstacle();
            }

            SpawnFood();
            UpdateUI();
        }
    }

    private void Grow()
    {
        GameObject segment = Instantiate(bodyPrefab);
        segment.transform.SetParent(bodyFolder);

        Vector3 spawnPos;
        if (_segments.Count == 1) spawnPos = _segments[0].position - (Vector3)_direction;
        else spawnPos = _segments[_segments.Count - 1].position;

        segment.transform.position = spawnPos;
        segment.tag = "Player";
        segment.transform.localScale = new Vector3(0.6f, 0.6f, 1f);

        Color modeColor = _isSabotageMode ? Color.red : Color.white;
        segment.GetComponent<SpriteRenderer>().color = modeColor;

        BoxCollider2D bc = segment.AddComponent<BoxCollider2D>();
        bc.isTrigger = true;
        bc.size = new Vector2(0.8f, 0.8f);

        _segments.Add(segment.transform);
    }

    // --- SPAWNING LOGIC (Updated to check for empty space) ---

    private void SpawnFood()
    {
        Vector3 pos = GetSafeRandomPos(); // Uses new safe checker
        GameObject f = Instantiate(foodPrefab, pos, Quaternion.identity);
        f.tag = "Food";
        f.transform.SetParent(itemFolder);
        f.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
    }

    private void SpawnObstacle()
    {
        Vector3 pos = GetSafeRandomPos(); // Uses new safe checker
        GameObject o = Instantiate(obstaclePrefab, pos, Quaternion.identity);
        o.tag = "Obstacle";
        o.transform.SetParent(itemFolder);
        o.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
    }

    // New function that retries if the position is inside the worm
    private Vector3 GetSafeRandomPos()
    {
        int attempts = 0;
        bool isSafe = false;
        Vector3 potentialPos = Vector3.zero;

        while (!isSafe && attempts < 50)
        {
            potentialPos = GetRandomPos();
            isSafe = true;

            // Check if this position hits any body part
            foreach (Transform part in _segments)
            {
                if (Mathf.Round(part.position.x) == potentialPos.x &&
                    Mathf.Round(part.position.y) == potentialPos.y)
                {
                    isSafe = false;
                    break;
                }
            }
            attempts++;
        }
        return potentialPos;
    }

    private void SpawnWalls()
    {
        if (wallPrefab == null) return;

        for (int x = -borderSize; x <= borderSize; x++)
        {
            CreateWall(x, borderSize);
            CreateWall(x, -borderSize);
        }
        for (int y = -borderSize; y <= borderSize; y++)
        {
            CreateWall(borderSize, y);
            CreateWall(-borderSize, y);
        }
    }

    private void CreateWall(float x, float y)
    {
        GameObject w = Instantiate(wallPrefab, new Vector3(x, y, 0), Quaternion.identity);
        w.tag = "Obstacle";
        w.transform.SetParent(wallFolder);
        w.transform.localScale = new Vector3(0.8f, 0.8f, 1f);
    }

    private Vector3 GetRandomPos()
    {
        return new Vector3(
            Mathf.Round(Random.Range(-borderSize + 2, borderSize - 2)),
            Mathf.Round(Random.Range(-borderSize + 2, borderSize - 2)),
            0);
    }

    private void UpdateUI()
    {
        GetComponent<SpriteRenderer>().color = _isSabotageMode ? Color.red : Color.white;

        if (scoreText != null) scoreText.text = "BLUE: " + _myScore + " | RED: " + _enemyScore;
        if (modeText != null) modeText.text = _isSabotageMode ? "MODE: SABOTAGE" : "MODE: SECURE";
    }

    private void GameOver()
    {
        _isAlive = false;
        _isGameOver = true;

        CancelInvoke();

        if (crashSound != null) GetComponent<AudioSource>().PlayOneShot(crashSound);

        Time.timeScale = 0;
        if (gameOverPanel != null) gameOverPanel.SetActive(true);
    }
}