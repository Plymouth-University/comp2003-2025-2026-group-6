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
    private List<Transform> _segments = new List<Transform>();

    // Game Flow Flags
    private bool _isAlive = true;
    private bool _isGameOver = false;
    private bool _inMenu = true;        // True = Showing Start Screen
    private bool _hasStartedMoving = false; // True = Player pressed WASD

    // Folders for hierarchy organization
    private Transform wallFolder;
    private Transform bodyFolder;
    private Transform itemFolder;

    // CTF Logic
    private bool _isSabotageMode = false;
    private int _myScore = 0;
    private int _enemyScore = 150;

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

        // NOTE: We do NOT start moving here anymore. We wait for WASD.
    }

    private void Update()
    {
        // 1. MENU PHASE (Waiting for 'R')
        if (_inMenu)
        {
            if (Input.GetKeyDown(KeyCode.R))
            {
                InitializeSystem();
            }
            return; // Stop here, don't read other inputs
        }

        // 2. GAME OVER PHASE (Waiting for 'R')
        if (_isGameOver)
        {
            if (Input.GetKeyDown(KeyCode.R))
            {
                Time.timeScale = 1;
                SceneManager.LoadScene(SceneManager.GetActiveScene().name);
            }
            return;
        }

        // 3. READY PHASE (Waiting for WASD to start moving)
        if (!_hasStartedMoving)
        {
            if (Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow) ||
                Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow) ||
                Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow) ||
                Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow))
            {
                _hasStartedMoving = true;
                InvokeRepeating(nameof(Move), moveSpeed, moveSpeed); // Start the loop
            }
        }

        // 4. INPUTS (Direction Control)
        if ((Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow)) && _direction != Vector2.down)
            _direction = Vector2.up;
        else if ((Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow)) && _direction != Vector2.up)
            _direction = Vector2.down;
        else if ((Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow)) && _direction != Vector2.right)
            _direction = Vector2.left;
        else if ((Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow)) && _direction != Vector2.left)
            _direction = Vector2.right;

        // Mode Toggle (Can be done even before moving)
        if (Input.GetKeyDown(KeyCode.Space))
        {
            _isSabotageMode = !_isSabotageMode;
            if (switchSound != null) GetComponent<AudioSource>().PlayOneShot(switchSound);
            UpdateUI();
        }
    }

    // Called when player presses 'R' at the menu
    public void InitializeSystem()
    {
        _inMenu = false;
        Time.timeScale = 1; // Unfreeze visuals

        if (startMenuPanel != null) startMenuPanel.SetActive(false); // Hide Menu
        if (switchSound != null) GetComponent<AudioSource>().PlayOneShot(switchSound);
    }

    private void Move()
    {
        if (!_isAlive) return;

        // Move body parts to follow head
        for (int i = _segments.Count - 1; i > 0; i--)
        {
            _segments[i].position = _segments[i - 1].position;
        }

        // Calculate new head position
        float x = Mathf.Round(transform.position.x) + _direction.x;
        float y = Mathf.Round(transform.position.y) + _direction.y;
        transform.position = new Vector3(x, y, 0.0f);

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
            SpawnFood();

            // Update Score
            if (_isSabotageMode) _enemyScore -= 10;
            else _myScore += 10;

            UpdateUI();
        }
    }

    private void Grow()
    {
        GameObject segment = Instantiate(bodyPrefab);
        segment.transform.SetParent(bodyFolder); // Clean hierarchy

        Vector3 spawnPos;
        if (_segments.Count == 1) spawnPos = _segments[0].position - (Vector3)_direction;
        else spawnPos = _segments[_segments.Count - 1].position;

        segment.transform.position = spawnPos;
        segment.tag = "Player";
        segment.transform.localScale = new Vector3(0.6f, 0.6f, 1f);

        // Color based on mode
        Color modeColor = _isSabotageMode ? Color.red : Color.white;
        segment.GetComponent<SpriteRenderer>().color = modeColor;

        BoxCollider2D bc = segment.AddComponent<BoxCollider2D>();
        bc.isTrigger = true;
        bc.size = new Vector2(0.8f, 0.8f);

        _segments.Add(segment.transform);
    }

    private void SpawnFood()
    {
        Vector3 pos = GetRandomPos();
        GameObject f = Instantiate(foodPrefab, pos, Quaternion.identity);
        f.tag = "Food";
        f.transform.SetParent(itemFolder);
        f.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
    }

    private void SpawnObstacle()
    {
        Vector3 pos = GetRandomPos();
        GameObject o = Instantiate(obstaclePrefab, pos, Quaternion.identity);
        o.tag = "Obstacle";
        o.transform.SetParent(itemFolder);
        o.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
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
        w.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
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

        Time.timeScale = 0; // Freeze everything
        if (gameOverPanel != null) gameOverPanel.SetActive(true);
    }
}