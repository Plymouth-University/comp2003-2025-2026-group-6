using UnityEngine;

public class ObsticleMove : MonoBehaviour
{
    public static float moveSpeed = 5f;
    public float deadzone = -30f;
    public float objectSpeed;

    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        objectSpeed = moveSpeed;
    }

    // Update is called once per frame
    void Update()
    {
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

