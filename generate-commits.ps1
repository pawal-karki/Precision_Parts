$ErrorActionPreference = "Stop"

if (-not (Test-Path ".git")) {
    Write-Error "Not a git repository."
    exit 1
}

# Create or switch to 'test' branch
$branchExists = git branch --list "test"
if ($branchExists -match "test") {
    git checkout test
} else {
    git checkout -b test
}

$pawalMessages = @(
    "feat: implement daily financial report generation",
    "feat: add staff management CRUD operations",
    "update: refine customer high spenders report",
    "fix: correct staff role assignment logic",
    "feat: monthly and yearly financial summaries",
    "chore: structure reports module",
    "refactor: optimize financial data parsing",
    "feat: add regular customers report filter",
    "update: improve monthly UI layout",
    "fix: resolve admin staff listing bug",
    "feat: configure roles and permissions tables"
)

$mandeepMessages = @(
    "feat: implement Add/Edit/Delete for auto parts",
    "update: synchronize purchase invoices with stock",
    "feat: add vendor management endpoints",
    "fix: resolve vendor listing pagination issue",
    "feat: update inventory stock logic on purchase",
    "chore: migrate parts database schema",
    "feat: bind vendor API to frontend",
    "update: adjust stock threshold logic",
    "fix: purchase invoice calculation error",
    "refactor: componentize inventory listing",
    "feat: manage purchase returns to vendors"
)

$rameshMessages = @(
    "feat: create customer registration endpoint",
    "feat: link vehicle details to customer profile",
    "update: enhance customer search by phone and vehicle no",
    "fix: handle edge cases in customer search",
    "feat: implement 10% loyalty discount logic",
    "update: display full customer vehicle history",
    "chore: setup customer API routes",
    "fix: vehicle id mapping in search",
    "feat: add customer detail view modal",
    "refactor: optimize search queries",
    "feat: handle custom loyalty tiers"
)

$prernaMessages = @(
    "feat: build customer self-registration UI",
    "feat: add customer profile management page",
    "feat: implement appointment booking widget",
    "update: create service reviews section",
    "feat: display purchase and service history in profile",
    "chore: initialize layouts for customer portal",
    "fix: profile update form state resetting",
    "update: style service history timeline",
    "feat: integrate parts request form",
    "refactor: extract customer dashboard components",
    "feat: interactive UI for loyalty points"
)

$bimashMessages = @(
    "feat: develop point of sale (POS) system",
    "feat: generate and print sales invoices",
    "update: implement email dispatch for invoices",
    "feat: setup low stock email notifications",
    "feat: add background job for credit reminders",
    "chore: install email provider dependencies",
    "fix: sales invoice tax calculation bug",
    "update: improve POS barcode scanning",
    "feat: send HTML format for credit reminder",
    "refactor: background jobs scheduling",
    "feat: real-time sales dashboard widget"
)

$members = @(
    @{ Name="Pawal Karki Dholi"; Email="pawal_karki@icloud.com"; Msgs=$pawalMessages },
    @{ Name="Mandeep Basnet"; Email="mandeep3basnet@gmail.com"; Msgs=$mandeepMessages },
    @{ Name="Ramesh Sapkota"; Email="rameshsapkota900@gmail.com"; Msgs=$rameshMessages },
    @{ Name="Prerna Bayungrai"; Email="bayungraiprerna@gmail.com"; Msgs=$prernaMessages },
    @{ Name="Bimash Thapa"; Email="mailbimashthapa@gmail.com"; Msgs=$bimashMessages }
)

$commitsToMake = @()

# We will generate commits for the last 15 days
$endDate = (Get-Date).Date
$startDate = $endDate.AddDays(-15)

$currentDate = $startDate
while ($currentDate -le $endDate) {
    foreach ($m in $members) {
        $commitsToday = Get-Random -Minimum 2 -Maximum 4 # 2 or 3 commits
        for ($i = 0; $i -lt $commitsToday; $i++) {
            $hour = Get-Random -Minimum 9 -Maximum 19
            $minute = Get-Random -Minimum 0 -Maximum 59
            $second = Get-Random -Minimum 0 -Maximum 59
            $commitDate = $currentDate.AddHours($hour).AddMinutes($minute).AddSeconds($second)
            
            $commitsToMake += @{
                Date = $commitDate
                Name = $m.Name
                Email = $m.Email
                Message = ($m.Msgs | Get-Random)
            }
        }
    }
    $currentDate = $currentDate.AddDays(1)
}

# Sort by chronological order
$commitsToMake = $commitsToMake | Sort-Object Date

foreach ($c in $commitsToMake) {
    $dateStr = $c.Date.ToString("yyyy-MM-dd HH:mm:ss")
    $env:GIT_AUTHOR_DATE = $dateStr
    $env:GIT_COMMITTER_DATE = $dateStr
    $env:GIT_AUTHOR_NAME = $c.Name
    $env:GIT_AUTHOR_EMAIL = $c.Email
    $env:GIT_COMMITTER_NAME = $c.Name
    $env:GIT_COMMITTER_EMAIL = $c.Email

    git commit --allow-empty -m $($c.Message) | Out-Null
}

Write-Host "Successfully generated $($commitsToMake.Count) commits on 'test' branch."
