using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerMove : MonoBehaviour
{
    public float jumpForce = 7f;
    private Rigidbody2D rb;

    public static bool gameOver = false;

    void Start()
    {
        Time.timeScale = 1f;
        gameOver = false;
        rb = GetComponent<Rigidbody2D>();
    }

    void Update()
    {
        if (gameOver) return;

        if (Keyboard.current.spaceKey.wasPressedThisFrame)
        {
            rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpForce);
        }
    }

    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.CompareTag("Obstacle"))
        {
            gameOver = true;
            Time.timeScale = 0f;
            Debug.Log("GAME OVER");
        }
    }
}