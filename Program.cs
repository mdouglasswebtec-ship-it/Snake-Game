using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

internal static class Program
{
    private const int Width = 30;
    private const int Height = 20;
    private const int TickMs = 110;

    private static readonly Random Random = new();

    private static Direction _direction = Direction.Right;
    private static bool _gameOver;
    private static int _score;
    private static Point _food;
    private static LinkedList<Point> _snake = new();

    private static void Main()
    {
        Console.Title = "Snake (C# Console)";
        Console.CursorVisible = false;

        if (Console.WindowWidth < Width + 2 || Console.WindowHeight < Height + 5)
        {
            try
            {
                Console.SetWindowSize(Math.Max(Console.WindowWidth, Width + 2), Math.Max(Console.WindowHeight, Height + 5));
                Console.SetBufferSize(Math.Max(Console.BufferWidth, Width + 2), Math.Max(Console.BufferHeight, Height + 5));
            }
            catch
            {
                // Ignore if terminal size cannot be changed.
            }
        }

        while (true)
        {
            InitializeGame();
            GameLoop();

            Console.SetCursorPosition(0, Height + 2);
            Console.Write($"Game Over! Score: {_score}. Press R to restart or Q to quit.   ");

            while (true)
            {
                var key = Console.ReadKey(true).Key;
                if (key == ConsoleKey.R)
                {
                    break;
                }

                if (key == ConsoleKey.Q || key == ConsoleKey.Escape)
                {
                    Console.ResetColor();
                    Console.Clear();
                    return;
                }
            }
        }
    }

    private static void InitializeGame()
    {
        _gameOver = false;
        _score = 0;
        _direction = Direction.Right;
        _snake = new LinkedList<Point>();

        int startX = Width / 2;
        int startY = Height / 2;

        _snake.AddFirst(new Point(startX, startY));
        _snake.AddLast(new Point(startX - 1, startY));
        _snake.AddLast(new Point(startX - 2, startY));

        SpawnFood();
        DrawWholeBoard();
    }

    private static void GameLoop()
    {
        DateTime nextTick = DateTime.UtcNow;

        while (!_gameOver)
        {
            HandleInput();

            if (DateTime.UtcNow < nextTick)
            {
                Thread.Sleep(1);
                continue;
            }

            nextTick = nextTick.AddMilliseconds(TickMs);
            Step();
            DrawWholeBoard();
        }
    }

    private static void HandleInput()
    {
        while (Console.KeyAvailable)
        {
            var key = Console.ReadKey(true).Key;
            switch (key)
            {
                case ConsoleKey.UpArrow when _direction != Direction.Down:
                case ConsoleKey.W when _direction != Direction.Down:
                    _direction = Direction.Up;
                    break;
                case ConsoleKey.DownArrow when _direction != Direction.Up:
                case ConsoleKey.S when _direction != Direction.Up:
                    _direction = Direction.Down;
                    break;
                case ConsoleKey.LeftArrow when _direction != Direction.Right:
                case ConsoleKey.A when _direction != Direction.Right:
                    _direction = Direction.Left;
                    break;
                case ConsoleKey.RightArrow when _direction != Direction.Left:
                case ConsoleKey.D when _direction != Direction.Left:
                    _direction = Direction.Right;
                    break;
                case ConsoleKey.Escape:
                case ConsoleKey.Q:
                    _gameOver = true;
                    break;
            }
        }
    }

    private static void Step()
    {
        Point head = _snake.First!.Value;
        Point newHead = _direction switch
        {
            Direction.Up => new Point(head.X, head.Y - 1),
            Direction.Down => new Point(head.X, head.Y + 1),
            Direction.Left => new Point(head.X - 1, head.Y),
            _ => new Point(head.X + 1, head.Y)
        };

        if (newHead.X < 0 || newHead.X >= Width || newHead.Y < 0 || newHead.Y >= Height)
        {
            _gameOver = true;
            return;
        }

        bool eatingFood = newHead.Equals(_food);

        Point currentTail = _snake.Last!.Value;
        bool hitsSnake = _snake.Any(segment => segment.Equals(newHead));
        if (hitsSnake && !(newHead.Equals(currentTail) && !eatingFood))
        {
            _gameOver = true;
            return;
        }

        _snake.AddFirst(newHead);

        if (eatingFood)
        {
            _score += 10;
            SpawnFood();
            return;
        }

        _snake.RemoveLast();
    }

    private static void SpawnFood()
    {
        while (true)
        {
            var candidate = new Point(Random.Next(0, Width), Random.Next(0, Height));
            if (_snake.All(segment => !segment.Equals(candidate)))
            {
                _food = candidate;
                return;
            }
        }
    }

    private static void DrawWholeBoard()
    {
        Console.SetCursorPosition(0, 0);

        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("+" + new string('-', Width) + "+");

        var bodySet = new HashSet<Point>(_snake.Skip(1));
        Point head = _snake.First!.Value;

        for (int y = 0; y < Height; y++)
        {
            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.Write("|");

            for (int x = 0; x < Width; x++)
            {
                var p = new Point(x, y);

                if (p.Equals(head))
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.Write("@");
                }
                else if (bodySet.Contains(p))
                {
                    Console.ForegroundColor = ConsoleColor.DarkGreen;
                    Console.Write("o");
                }
                else if (p.Equals(_food))
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.Write("*");
                }
                else
                {
                    Console.Write(" ");
                }
            }

            Console.ForegroundColor = ConsoleColor.DarkGray;
            Console.WriteLine("|");
        }

        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("+" + new string('-', Width) + "+");

        Console.ForegroundColor = ConsoleColor.White;
        Console.Write($"Score: {_score}  Controls: Arrows/WASD  Quit: Q or Esc        ");
    }

    private readonly record struct Point(int X, int Y);

    private enum Direction
    {
        Up,
        Down,
        Left,
        Right
    }
}