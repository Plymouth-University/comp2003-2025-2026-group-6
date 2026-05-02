using UnityEngine;
using TMPro;
using System.Runtime.InteropServices;

public class DataStacker : MonoBehaviour
{
    public GameObject blockPrefab;

    public TextMeshProUGUI scoreText;
    public GameObject gameOverScreen;
    public GameObject startScreen;

    private GameObject currentBlock;
    private GameObject lastBlock;

    private float moveSpeed = 5f;
    private bool movingRight = true;
    private float boundary = 6f;

    // Set starting width and position
    private float currentWidth = 3f;
    private Vector2 currentPos = new Vector2(0, -6.5f);

    private int score = 0;
    private bool isGameOver = false;
    private bool gameStarted = false;

    private float currentHue = 0f;

    // Import WebGL bridge
    [DllImport("__Internal")]
    private static extern void SendScoreToWeb(int finalScore);

    void Start()
    {
        // Setup camera size and position
        Camera.main.orthographicSize = 8.5f;
        Camera.main.transform.position = new Vector3(0, 0f, -10f);

        // Initialize UI
        gameOverScreen.SetActive(false);
        startScreen.SetActive(true);
        scoreText.text = "SCORE: 0";

        // Spawn base block
        lastBlock = Instantiate(blockPrefab, new Vector2(0, -7.5f), Quaternion.identity);
        lastBlock.transform.localScale = new Vector3(currentWidth, 1f, 1f);
        lastBlock.GetComponent<SpriteRenderer>().color = Color.HSVToRGB(currentHue, 1f, 1f);
    }

    void Update()
    {
        // Wait for game start
        if (!gameStarted)
        {
            if (Input.GetKeyDown(KeyCode.Space))
            {
                gameStarted = true;
                startScreen.SetActive(false);
                SpawnBlock();
            }
            return;
        }

        // Stop loop if game over
        if (isGameOver) return;

        // Handle block movement and placement
        if (currentBlock != null)
        {
            MoveBlock();

            if (Input.GetKeyDown(KeyCode.Space))
            {
                PlaceBlock();
            }
        }
    }

    void MoveBlock()
    {
        // Move block side to side
        float direction = movingRight ? 1f : -1f;
        currentBlock.transform.Translate(Vector2.right * direction * moveSpeed * Time.deltaTime);

        // Reverse direction at boundaries
        if (currentBlock.transform.position.x > boundary) movingRight = false;
        if (currentBlock.transform.position.x < -boundary) movingRight = true;
    }

    void PlaceBlock()
    {
        // Calculate overhang
        float distance = currentBlock.transform.position.x - lastBlock.transform.position.x;
        float overhangWidth = Mathf.Abs(distance);

        // Handle complete miss
        if (overhangWidth >= currentWidth)
        {
            currentBlock.AddComponent<Rigidbody2D>();
            TriggerGameOver();
            return;
        }

        // Handle partial hit and slice block
        if (overhangWidth > 0.01f)
        {
            float fallingX = currentBlock.transform.position.x + ((currentWidth - overhangWidth) / 2f * Mathf.Sign(distance));
            SpawnFallingBlock(fallingX, overhangWidth);
            currentWidth -= overhangWidth;
        }

        // Snap block to center of the stack
        float newX = lastBlock.transform.position.x + (distance / 2);
        currentBlock.transform.position = new Vector2(newX, currentBlock.transform.position.y);
        currentBlock.transform.localScale = new Vector3(currentWidth, 1f, 1f);

        // Update tracking variables
        lastBlock = currentBlock;
        currentPos.y += 1f;
        moveSpeed += 0.5f;

        // Update score
        score += 100;
        scoreText.text = "SCORE: " + score;

        // Move camera up as stack grows
        float cameraY = Mathf.Max(0f, currentPos.y - 2f);
        Camera.main.transform.position = new Vector3(0, cameraY, -10f);

        SpawnBlock();
    }

    void SpawnBlock()
    {
        // Spawn next block at the edge
        movingRight = !movingRight;
        float startX = movingRight ? -boundary : boundary;

        currentBlock = Instantiate(blockPrefab, new Vector2(startX, currentPos.y), Quaternion.identity);
        currentBlock.transform.localScale = new Vector3(currentWidth, 1f, 1f);

        // Change block color
        currentHue += 0.05f;
        if (currentHue > 1f) currentHue = 0f;
        currentBlock.GetComponent<SpriteRenderer>().color = Color.HSVToRGB(currentHue, 1f, 1f);
    }

    void SpawnFallingBlock(float xPos, float width)
    {
        // Create falling debris
        GameObject fallingBlock = Instantiate(blockPrefab, new Vector2(xPos, currentBlock.transform.position.y), Quaternion.identity);
        fallingBlock.transform.localScale = new Vector3(width, 1f, 1f);
        fallingBlock.GetComponent<SpriteRenderer>().color = currentBlock.GetComponent<SpriteRenderer>().color;

        fallingBlock.AddComponent<Rigidbody2D>();
        Destroy(fallingBlock, 3f);
    }

    void TriggerGameOver()
    {
        // Show game over screen
        isGameOver = true;
        gameOverScreen.SetActive(true);

        // Send score to HTML
#if UNITY_WEBGL && !UNITY_EDITOR
        SendScoreToWeb(score);
#endif
    }
}