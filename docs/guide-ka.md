# როგორ დავამატო მასალა — ყოველდღიური სახელმძღვანელო

## 1. გაშვება

```bash
pnpm dev
```

გახსენი http://localhost:4321. ფაილის შენახვისას გვერდი თავისით განახლდება.
ძიება (`/`) მხოლოდ `pnpm build`-ის შემდეგ მუშაობს — `dev`-ში ის ცარიელია, ეს ნორმალურია.

## 2. ახალი თემა

```bash
pnpm new topic algebra/quadratic-equations equations
```

- `algebra` — საგანი (სია: `src/subjects.ts`),
- `quadratic-equations` — მისამართი: მხოლოდ ლათინური პატარა ასოები და ტირე,
- `equations` — განყოფილება (თუ არ მიუთითებ, პირველი აირჩევა).

იქმნება ფაილი `src/content/topics/algebra/quadratic-equations.mdx`, მასში უკვე არის ყველა ბლოკის ნიმუში.
ახალი საგნისთვის ჯერ `src/subjects.ts`-ში ჩაამატე ერთი ჩანაწერი.

## 3. ფაილის თავი (frontmatter)

```yaml
title: კვადრატული განტოლებები     # სათაური
slug: quadratic-equations        # ფაილის სახელის ტოლი
subject: algebra
section: equations
order: 2                          # რიგითი ნომერი ნავიგაციაში
summary: ერთი წინადადება, უბრალო ტექსტი.   # ≤ 160 სიმბოლო, მათემატიკის გარეშე!
tags: [დისკრიმინანტი, ვიეტის თეორემა]     # ძიებისთვის
prerequisites: [abs-equations]   # სხვა თემების slug-ები
status: draft                    # done — მხოლოდ შემოწმების შემდეგ
figure: rhombus                  # არასავალდებულო: ინტერაქტიული ნახაზი
```

## 4. ბლოკები

```mdx
<Definition>**ტერმინი** — განმარტება.</Definition>

<Formulas>
<Formula id="discriminant" name="დისკრიმინანტი" tex="D = b^2 - 4ac" proof="roots" />
</Formulas>

<Properties>
<Property id="roots" title="თვისების ფორმულირება" why="ერთი წინადადება — რატომ.">
<Proof given="$ax^2 + bx + c = 0$" prove="$x = \frac{-b \pm \sqrt D}{2a}$">
<Step tex="...">ნაბიჯის ახსნა.</Step>
</Proof>
</Property>
</Properties>

<Remark kind="mistake">გავრცელებული შეცდომა.</Remark>
```

- `Formula` ფორმულების ჩანართშია, დანარჩენი — თვისებების ჩანართში.
- `proof="roots"` ფორმულას თვისების დამტკიცებასთან აკავშირებს.
- `id` გვერდზე უნიკალურია და ბმულად გამოიყენება: `/algebra/quadratic-equations/#roots`.
- `Property kind`: `property` (თვისება), `criterion` (ნიშანი), `converse` (შებრუნებული თეორემა).
- `Remark kind`: `note` (შენიშვნა), `special` (კერძო შემთხვევა), `mistake` (გავრცელებული შეცდომა), `convention` (შეთანხმება).

## 5. მათემატიკის წერა — ყურადღება!

- ტექსტში: `$x^2$`. ცალკე ხაზზე `tex="..."` ატრიბუტში დოლარის ნიშნის გარეშე.
- **ერთი** უკუხაზი: `tex="\frac{a}{b}"`. ორი უკუხაზი `\\` KaTeX-ში ახალ ხაზს ნიშნავს
  (გამოიყენება მხოლოდ `\begin{cases} ... \\ ... \end{cases}`-ში).
- **`summary`-ში მათემატიკა არ ჩაწერო** — ის უბრალო ტექსტად ჩანს.
- ქართული ბოლოსართი ფორმულის შემდეგ — ტირით: `$O$-ს`, `$a$-დან`. ასე ხაზზე არ გაწყდება.
- დამტკიცების ბოლოს: `\quad \blacksquare` ან ∎.

## 6. ნახაზი და დამტკიცების ნაბიჯები

თუ თემას `figure` აქვს, დამტკიცების ნაბიჯი ნახაზს მართავს:

```mdx
<Step show="AC BD O" hl="AO=OC" set={{ alpha: 60 }}>...</Step>
```

- `show` — დამხმარე ხაზები (წყვეტილი), `hl` — ამ ნაბიჯში გამოკვეთილი, `set` — ნახაზის პარამეტრები.
- აღნიშვნები: `AB` მონაკვეთი, `ABC` მრავალკუთხედი, `<ABC` კუთხე, `AB=CD` ტოლი მონაკვეთები,
  `AB||CD` პარალელური, `(OA)` წრეწირი.
- ყოველ `Property`-ს ნახაზის ფაილში (`src/figures/*.ts`, `checks`) იმავე `id`-ით რიცხვითი შემოწმება სჭირდება.
  ახალი ნახაზი კოდის წერაა — ამისთვის იხ. `CLAUDE.md`.

ნახაზის გარეშე თემა (მაგ. ალგებრა) უბრალოდ ტექსტის განლაგებით ჩანს — ეს ნორმალურია.

## 7. ტერმინები

ყოველი ახალი **გამუქებული** ტერმინი `Definition`-ში უნდა იყოს `src/content/glossary.json`-ში.
თუ ზუსტად არ იცი, სკოლაში როგორ ჰქვია — ჯერ გადაამოწმე სახელმძღვანელოში. `avoid`-ში ჩაწერილ
არასწორ ვარიანტებს `pnpm check` იპოვის.

## 8. შემოწმება

```bash
pnpm check
```

| შეცდომა | რას ნიშნავს |
| --- | --- |
| `slug matches the file name` | `slug` და ფაილის სახელი განსხვავდება |
| `prerequisites ... existing topics` | `prerequisites`-ში ასეთი თემა არ არსებობს |
| `internal links resolve` | ბმული არარსებულ გვერდზე |
| `terms defined in bold` | ახალი ტერმინი glossary.json-ში არ არის |
| `every property has a numeric check` | ნახაზში ამ თვისების შემოწმება აკლია |
| `proof steps only use points` | ნაბიჯში ნახსენები წერტილი ნახაზზე არ არის |
| `formula proof links` | `proof="..."` არარსებულ თვისებას უთითებს |
| `every topic is translated` | ახალ თემას ინგლისური ვერსია (`src/content/topics-en/`) აკლია — `pnpm translate` (იხ. CLAUDE.md) |
| `English topics mirror the Georgian ones` | ქართულ ფაილში ბლოკი, id, რიცხვი ან `status` შეიცვალა — იგივე შეცვალე ინგლისურ ფაილშიც |

ფორმულის სინტაქსის შეცდომას (`KaTeX parse error`) `pnpm dev` ან `pnpm build` აჩვენებს.

## 9. დასრულება და გამოქვეყნება

1. ტექსტი და დამტკიცებები შეამოწმე → `status: done`.
2. `pnpm check && pnpm build`.
3. `git add` → `git commit` → `git push` — Vercel საიტს თავისით განაახლებს.
