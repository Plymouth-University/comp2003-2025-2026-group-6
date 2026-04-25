using UnityEngine;

public class ObsticleMove : MonoBehaviour
{
    public static float moveSpeed = 5f;
    public float deadzone = -30f;
    public float objectSpeed;

    void Start()
    {
        objectSpeed = moveSpeed;
    }

    void Update()
    {
        if (PlayerMove.gameOver) return;

        transform.position = transform.position + (Vector3.left * objectSpeed) * Time.deltaTime;

        if (transform.position.x < deadzone)
        {
            Destroy(gameObject);
        }
    }

    public static void IncreaseSpeed(float acceleration, int moveSpeedCap)
    {
        if (moveSpeed < moveSpeedCap)
        {
            moveSpeed += acceleration;
        }
    }
}