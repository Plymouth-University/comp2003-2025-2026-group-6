using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class CyberWorm : MonoBehaviour
{
    [Header("Game Settings")]
    public float moveSpeed = 0.15f; // Your preferred speed
    public int borderSize = 12;     // Your preferred map size
    public int growthAmount = 2;

    [Header("References")]
    public GameObject bodyPrefab;
    public GameObject foodPrefab;
    public GameObject obstaclePrefab;
    public GameObject wallPrefab;
    public Text scoreText;
    public Text modeText;

    // State
    private Vector2 _direction = Vector2.right;
    private List<Transform> _segments = new List<Transform>();
    private bool _isAlive = true;

    // CTF Logic
    private bool _isSabotageMode = false;
    private int _myScore = 0;
    private int _enemyScore = 150;

    private void Start()
    {
        _segments.Clear();
        _segments.Add(this.transform);

        // SCALE CHANGE: Set head to 0.9 (Big Square)
        transform.localScale = new Vector3(0.9f, 0.9f, 1f);

        SpawnFood();
        SpawnObstacle();
        SpawnWalls();
        UpdateUI();

        InvokeRepeating(nameof(Move), moveSpeed, moveSpeed);
    }

    private void Update()
    {
        if ((Input.GetKeyDown(KeyCode.W) || Input.GetKeyDown(KeyCode.UpArrow)) && _direction != Vector2.down)
            _direction = Vector2.up;
        else if ((Input.GetKeyDown(KeyCode.S) || Input.GetKeyDown(KeyCode.DownArrow)) && _direction != Vector2.up)
            _direction = Vector2.down;
        else if ((Input.GetKeyDown(KeyCode.A) || Input.GetKeyDown(KeyCode.LeftArrow)) && _direction != Vector2.right)
            _direction = Vector2.left;
        else if ((Input.GetKeyDown(KeyCode.D) || Input.GetKeyDown(KeyCode.RightArrow)) && _direction != Vector2.left)
            _direction = Vector2.right;

        if (Input.GetKeyDown(KeyCode.Space))
        {
            _isSabotageMode = !_isSabotageMode;
            UpdateUI();
        }
    }

    private void Move()
    {
        if (!_isAlive) return;

        for (int i = _segments.Count - 1; i > 0; i--)
        {
            _segments[i].position = _segments[i - 1].position;
        }

        float x = Mathf.Round(transform.position.x) + _direction.x;
        float y = Mathf.Round(transform.position.y) + _direction.y;
        transform.position = new Vector3(x, y, 0.0f);

        if (Mathf.Abs(x) >= borderSize || Mathf.Abs(y) >= borderSize)
        {
            GameOver();
        }
    }

    private void OnTriggerEnter2D(Collider2D other)
    {
        // Ignore hitting our own tail if it just spawned
        if (other.CompareTag("Player"))
        {
            if (_segments.Contains(other.transform))
            {
                if (other.transform == _segments[_segments.Count - 1]) return;
            }
            GameOver();
        }
        else if (other.CompareTag("Obstacle"))
        {
            GameOver();
        }
        else if (other.CompareTag("Food"))
        {
            for (int i = 0; i < growthAmount; i++) { Grow(); }

            Destroy(other.gameObject);
            SpawnFood();

            if (_isSabotageMode) _enemyScore -= 10;
            else _myScore += 10;

            UpdateUI();
        }
    }

    private void Grow()
    {
        GameObject segment = Instantiate(bodyPrefab);

        Vector3 spawnPos;
        if (_segments.Count == 1)
            spawnPos = _segments[0].position - (Vector3)_direction;
        else
            spawnPos = _segments[_segments.Count - 1].position;

        segment.transform.position = spawnPos;
        segment.tag = "Player";

        // SCALE CHANGE: Set body to 0.9 (Big Square)
        segment.transform.localScale = new Vector3(0.6f, 0.6f, 1f);

        // FIX APPLIED HERE: Use Color.white to keep original sprite colors
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
        // SCALE CHANGE: Set food to 0.9
        f.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
    }

    private void SpawnObstacle()
    {
        Vector3 pos = GetRandomPos();
        GameObject o = Instantiate(obstaclePrefab, pos, Quaternion.identity);
        o.tag = "Obstacle";
        // SCALE CHANGE: Set obstacle to 0.9
        o.transform.localScale = new Vector3(0.9f, 0.9f, 1f);
    }

    private void SpawnWalls()
    {
        if (wallPrefab == null) return;

        // Logic changed to Integers so walls line up perfectly with 0.9 scale
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
        // SCALE CHANGE: Set wall to 0.9
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
        // FIX APPLIED HERE: Use Color.white so the Green Bug isn't tinted neon green
        GetComponent<SpriteRenderer>().color = _isSabotageMode ? Color.red : Color.white;

        if (scoreText != null) scoreText.text = "BLUE: " + _myScore + " | RED: " + _enemyScore;
        if (modeText != null) modeText.text = _isSabotageMode ? "MODE: SABOTAGE" : "MODE: SECURE";
    }

    private void GameOver()
    {
        _isAlive = false;
        CancelInvoke();
        SceneManager.LoadScene(SceneManager.GetActiveScene().name);
    }
}