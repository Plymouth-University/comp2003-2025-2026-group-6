using UnityEngine;
using TMPro;

public class ScoreManager : MonoBehaviour
{
    public TextMeshProUGUI scoreText;
    public GameObject gameOverPanel;
    public TextMeshProUGUI finalScoreText;

    private float score = 0f;
    private bool shownGameOver = false;

    void Start()
    {
        gameOverPanel.SetActive(false);
    }

    void Update()
    {
        if (PlayerMove.gameOver)
        {
            if (!shownGameOver)
            {
                shownGameOver = true;
                int finalScore = Mathf.FloorToInt(score);
                finalScoreText.text = "Game Over\nScore: " + finalScore;
                gameOverPanel.SetActive(true);
            }

            return;
        }

        score += Time.deltaTime * 10f;
        scoreText.text = "Score: " + Mathf.FloorToInt(score);
    }
}