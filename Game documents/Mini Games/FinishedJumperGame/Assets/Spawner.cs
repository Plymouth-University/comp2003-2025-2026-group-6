using UnityEngine;

public class Spawner : MonoBehaviour
{
    public GameObject triangle;
    public float spawnRate;
    public float numberSpawned;
    public int spawnSpeedCap = 10;
    public float spawnRateIncrease = 0.5f;
    public int moveSpeedCap = 15;
    private float timer = 0;
    public float acceleration = 1;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        spawnRate = 20f;
        numberSpawned = 0;
        spawn();
    }

    // Update is called once per frame
    void Update()
    {
        if (timer < spawnRate/10)
        {
            timer += Time.deltaTime;
        }
        else
        {
            spawn();
            timer = 0;
            spawnRate = UnityEngine.Random.Range(15f, 25f);
            if (numberSpawned < spawnSpeedCap)
            {
                numberSpawned++;
            }
            spawnRate -= numberSpawned * spawnRateIncrease;

        }
    }

    void spawn()
    {
        Instantiate(triangle, new Vector3(transform.position.x, transform.position.y, 0), transform.rotation);
        ObsticleMove.IncreaseSpeed(acceleration, moveSpeedCap);
    }
}
